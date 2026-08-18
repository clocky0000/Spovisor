import * as React from "react";
import {
    Controller,
    FormProvider,
    useFormContext,
    useFormState,
    type ControllerProps,
    type FieldPath,
    type FieldValues,
} from "react-hook-form";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";

import { Label } from "./label";
import { cn } from "./utils";

// --- Form Provider ---
const Form = FormProvider;

// --- Form Field Context ---
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

// --- Hook: useFormField ---
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

// --- Form Item Context ---
type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

export interface FormItemProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function FormItem({ className, children, style, ...props }: FormItemProps) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <View className={cn("gap-1.5 mb-4", className)} style={style} {...props}>
        {children}
      </View>
    </FormItemContext.Provider>
  );
}

// --- Form Label ---
export interface FormLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  className?: string;
  style?: StyleProp<TextStyle>;
}

function FormLabel({ className, style, ...props }: FormLabelProps) {
  const { error } = useFormField();

  return (
    <Label
      className={cn(error && "text-red-500 dark:text-red-400", className)}
      style={style}
      {...props}
    />
  );
}

// --- Form Control (Slot 대신 자식 뷰 래퍼 사용) ---
export interface FormControlProps extends React.ComponentPropsWithoutRef<typeof View> {
  className?: string;
  children?: React.ReactNode;
}

function FormControl({ children, className, ...props }: FormControlProps) {
  return <View className={cn(className)} {...props}>{children}</View>;
}

// --- Form Description ---
export interface FormDescriptionProps extends React.ComponentPropsWithoutRef<typeof Text> {
  className?: string;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

function FormDescription({
  className,
  children,
  style,
  ...props
}: FormDescriptionProps) {
  const { formDescriptionId } = useFormField();

  return (
    <Text
      nativeID={formDescriptionId}
      className={cn("text-xs text-gray-500 dark:text-gray-400 leading-normal", className)}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

// --- Form Message (Error Message) ---
export interface FormMessageProps extends React.ComponentPropsWithoutRef<typeof Text> {
  className?: string;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

function FormMessage({
  className,
  children,
  style,
  ...props
}: FormMessageProps) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : children;

  if (!body) {
    return null;
  }

  return (
    <Text
      nativeID={formMessageId}
      className={cn("text-xs font-medium text-red-500 dark:text-red-400 mt-0.5", className)}
      style={style}
      {...props}
    >
      {body}
    </Text>
  );
}

export {
    Form, FormControl,
    FormDescription, FormField, FormItem,
    FormLabel, FormMessage, useFormField
};
