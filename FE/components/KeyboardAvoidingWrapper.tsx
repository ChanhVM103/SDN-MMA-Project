import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';

interface Props {
    children: React.ReactNode;
    style?: any;
    scrollEnabled?: boolean;
}

export default function KeyboardAvoidingWrapper({ children, style, scrollEnabled = true }: Props) {
    return (
        <KeyboardAvoidingView
            style={[styles.container, style]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                {scrollEnabled ? (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {children}
                    </ScrollView>
                ) : (
                    <>{children}</>
                )}
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
});
