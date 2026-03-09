declare module 'react-native-keyboard-aware-scroll-view' {
  import { Component } from 'react';
    import { ScrollViewProps } from 'react-native';

  export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
    extraScrollHeight?: number;
    enableOnAndroid?: boolean;
    enableAutomaticScroll?: boolean;
    enableResetScrollToCoords?: boolean;
    keyboardOpeningTime?: number;
    viewIsInsideTabBar?: boolean;
    keyboardShouldPersistTaps?: boolean | 'always' | 'never' | 'handled';
    keyboardDismissMode?: 'none' | 'on-drag' | 'interactive';
  }

  export class KeyboardAwareScrollView extends Component<KeyboardAwareScrollViewProps> {}
} 