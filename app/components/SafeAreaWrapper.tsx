import React from 'react';
import { 
    SafeAreaView, 
    Platform, 
    StatusBar, 
    StyleSheet, 
    View 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
    children: React.ReactNode;
    backgroundColor?: string;
    statusBarStyle?: 'light-content' | 'dark-content';
    excludeTop?: boolean;
    excludeBottom?: boolean;
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
    children,
    backgroundColor = '#FFFFFF',
    statusBarStyle = 'dark-content',
    excludeTop = false,
    excludeBottom = false,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <StatusBar 
                barStyle={statusBarStyle} 
                backgroundColor={backgroundColor}
                translucent={false}
            />
            <View 
                style={[
                    styles.content,
                    {
                        paddingTop: excludeTop ? 0 : insets.top,
                        paddingBottom: excludeBottom ? 0 : Math.max(insets.bottom, 20),
                    }
                ]}
            >
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});

export default SafeAreaWrapper;