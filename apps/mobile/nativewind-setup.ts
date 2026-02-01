import { cssInterop } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

// Configure third-party components to work with NativeWind className prop
cssInterop(SafeAreaView, { className: 'style' });
