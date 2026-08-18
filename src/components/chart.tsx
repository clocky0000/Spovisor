import * as React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { cn } from "./utils";

// --- Theme & Chart Config Types ---
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

// --- Chart Container ---
interface ChartContainerProps extends React.ComponentPropsWithoutRef<typeof View> {
  config: ChartConfig;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function ChartContainer({
  config,
  className,
  children,
  style,
  ...props
}: ChartContainerProps) {
  return (
    <ChartContext.Provider value={{ config }}>
      <View
        className={cn(
          "w-full aspect-video justify-center items-center rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800",
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </View>
    </ChartContext.Provider>
  );
}

// --- Chart Tooltip Content ---
interface ChartTooltipContentProps {
  title?: string;
  items?: Array<{
    key: string;
    value: number | string;
    color?: string;
  }>;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

function ChartTooltipContent({
  title,
  items = [],
  className,
  style,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!items.length && !title) return null;

  return (
    <View
      className={cn(
        "bg-gray-900/90 dark:bg-gray-800/90 p-3 rounded-xl border border-gray-700/50 shadow-lg min-w-[120px] gap-1.5",
        className
      )}
      style={style}
    >
      {title && (
        <Text className="text-xs font-semibold text-gray-200 mb-1">
          {title}
        </Text>
      )}
      {items.map((item) => {
        const itemConfig = config[item.key];
        const label = itemConfig?.label || item.key;
        const color = item.color || itemConfig?.color || "#3b82f6";
        const IconComponent = itemConfig?.icon;

        return (
          <View key={item.key} className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-1.5">
              {IconComponent ? (
                <IconComponent size={12} className="text-gray-300" />
              ) : (
                <View
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
              <Text className="text-xs text-gray-300">
                {typeof label === "string" ? label : item.key}
              </Text>
            </View>
            <Text className="text-xs font-bold text-white font-mono">
              {typeof item.value === "number"
                ? item.value.toLocaleString()
                : item.value}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// --- Chart Legend Content ---
interface ChartLegendContentProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  hideIcon?: boolean;
}

function ChartLegendContent({
  className,
  hideIcon = false,
  style,
  ...props
}: ChartLegendContentProps) {
  const { config } = useChart();

  const entries = Object.entries(config);
  if (!entries.length) return null;

  return (
    <View
      className={cn("flex-row items-center justify-center flex-wrap gap-4 pt-3", className)}
      style={style}
      {...props}
    >
      {entries.map(([key, itemConfig]) => {
        const IconComponent = itemConfig.icon;
        const color = itemConfig.color || "#6b7280";

        return (
          <View key={key} className="flex-row items-center gap-1.5">
            {IconComponent && !hideIcon ? (
              <IconComponent size={14} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <View
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: color }}
              />
            )}
            <Text className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {typeof itemConfig.label === "string"
                ? itemConfig.label
                : key}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export {
    ChartContainer, ChartLegendContent, ChartTooltipContent, useChart
};
