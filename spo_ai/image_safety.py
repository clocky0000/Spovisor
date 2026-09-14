import ipaddress
import socket
import time
from concurrent.futures import ThreadPoolExecutor
from threading import Lock
from urllib.parse import urljoin, urlparse

import cv2
import numpy as np
import requests


MAX_IMAGE_BYTES = 6 * 1024 * 1024
MAX_FILTER_URLS = 30
SAFE_RESULT_TTL_SECONDS = 6 * 60 * 60
FAILED_RESULT_TTL_SECONDS = 5 * 60

_face_detector = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
_profile_detector = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_profileface.xml"
)
_detector_lock = Lock()
_cache_lock = Lock()
_result_cache = {}


def _is_public_http_url(url):
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.hostname:
            return False
        if parsed.username or parsed.password:
            return False
        addresses = socket.getaddrinfo(parsed.hostname, parsed.port or 443)
        return bool(addresses) and all(
            ipaddress.ip_address(address[4][0]).is_global for address in addresses
        )
    except (OSError, ValueError):
        return False


def _download_image(url):
    current_url = url
    try:
        for _ in range(4):
            if not _is_public_http_url(current_url):
                return None
            with requests.get(
                current_url,
                headers={"User-Agent": "SpovisorImageSafety/1.0"},
                stream=True,
                allow_redirects=False,
                timeout=(3, 6),
            ) as response:
                if response.status_code in (301, 302, 303, 307, 308):
                    location = response.headers.get("Location")
                    if not location:
                        return None
                    current_url = urljoin(current_url, location)
                    continue
                if response.status_code != 200:
                    return None
                content_type = response.headers.get("Content-Type", "").lower()
                if not content_type.startswith("image/"):
                    return None
                content_length = response.headers.get("Content-Length")
                if content_length and int(content_length) > MAX_IMAGE_BYTES:
                    return None

                content = bytearray()
                for chunk in response.iter_content(chunk_size=64 * 1024):
                    content.extend(chunk)
                    if len(content) > MAX_IMAGE_BYTES:
                        return None
                if not content:
                    return None
                return cv2.imdecode(np.frombuffer(content, dtype=np.uint8), cv2.IMREAD_COLOR)
        return None
    except (requests.RequestException, ValueError, TypeError):
        return None


def contains_face(image):
    if image is None or image.size == 0:
        return False

    height, width = image.shape[:2]
    longest_side = max(height, width)
    if longest_side > 1280:
        scale = 1280 / longest_side
        image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

    gray = cv2.equalizeHist(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY))
    minimum_face_size = max(24, round(min(gray.shape[:2]) * 0.035))
    detection_options = {
        "scaleFactor": 1.08,
        "minNeighbors": 5,
        "minSize": (minimum_face_size, minimum_face_size),
    }

    # CascadeClassifier 인스턴스는 여러 요청에서 공유하므로 검출 구간만 직렬화한다.
    with _detector_lock:
        if len(_face_detector.detectMultiScale(gray, **detection_options)) > 0:
            return True
        if len(_profile_detector.detectMultiScale(gray, **detection_options)) > 0:
            return True
        return len(_profile_detector.detectMultiScale(cv2.flip(gray, 1), **detection_options)) > 0


def is_likely_photo(image):
    if image is None or image.size == 0:
        return False
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    histogram = cv2.calcHist([gray], [0], None, [256], [0, 256]).ravel()
    probabilities = histogram / histogram.sum()
    nonzero = probabilities[probabilities > 0]
    entropy = float(-(nonzero * np.log2(nonzero)).sum())

    # 단색 로고, 기본 아이콘, 이미지 없음 placeholder는 장소 사진으로 사용하지 않는다.
    return entropy >= 4.2 and float(gray.std()) >= 18.0


def _is_face_free(url):
    now = time.time()
    with _cache_lock:
        cached = _result_cache.get(url)
        if cached and cached[1] > now:
            return cached[0]

    image = _download_image(url)
    is_safe = image is not None and is_likely_photo(image) and not contains_face(image)
    ttl = SAFE_RESULT_TTL_SECONDS if image is not None else FAILED_RESULT_TTL_SECONDS
    with _cache_lock:
        if len(_result_cache) >= 2_000:
            expired = [key for key, value in _result_cache.items() if value[1] <= now]
            for key in expired:
                _result_cache.pop(key, None)
            if len(_result_cache) >= 2_000:
                oldest = min(_result_cache, key=lambda key: _result_cache[key][1])
                _result_cache.pop(oldest, None)
        _result_cache[url] = (is_safe, now + ttl)
    return is_safe


def filter_face_free_urls(urls):
    unique_urls = list(dict.fromkeys(
        url.strip() for url in urls
        if isinstance(url, str) and url.strip()
    ))[:MAX_FILTER_URLS]
    if not unique_urls:
        return []

    with ThreadPoolExecutor(max_workers=min(4, len(unique_urls))) as executor:
        checks = executor.map(_is_face_free, unique_urls)
        return [url for url, is_safe in zip(unique_urls, checks) if is_safe]
