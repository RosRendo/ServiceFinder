import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-surface">
          <View className="flex-1 items-center justify-center p-6">
            <MaterialCommunityIcons name="alert-circle" size={64} color="#dc2626" />
            <Text className="text-2xl font-bold text-on-surface mt-4 text-center">
              Oops! Something went wrong.
            </Text>
            <Text className="text-sm text-on-surface-variant text-center mt-2 mb-6">
              The app encountered an unexpected error. Please try again.
            </Text>
            
            <TouchableOpacity 
              onPress={this.handleReset}
              className="bg-primary px-8 py-3 rounded-full active:scale-95"
            >
              <Text className="text-white font-bold text-base">Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <ScrollView className="mt-8 w-full bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                <Text className="font-bold text-error mb-2">DEV ONLY ERROR TRACE:</Text>
                <Text className="text-xs font-mono text-on-surface-variant">
                  {this.state.error.toString()}
                </Text>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
