declare module 'emoji-flags' {
  interface EmojiFlag {
    code: string;
    emoji: string;
    unicode: string;
    name: string;
    title: string;
  }

  const emojiFlags: {
    [key: string]: EmojiFlag;
    data: EmojiFlag[];
    emojis: string[];
    codes: string[];
    names: string[];
    unicodes: string[];
    countryCode: (code: string) => EmojiFlag | undefined;
  };

  export default emojiFlags;
}

interface Window {
  __env?: {
    apiUrl?: string;
  };
}
