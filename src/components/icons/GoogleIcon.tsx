import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.3-.1-2.7-.4-4.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 16.3 3 9.7 7.3 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 45c5.5 0 10.4-1.8 14.2-5.1l-6.6-5.6C29.5 36 26.9 37 24 37c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 40.5 16.2 45 24 45z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.6 5.6C40.9 36.9 45 30.5 45 24c0-1.3-.1-2.7-.4-4.5z"
      />
    </Svg>
  );
}
