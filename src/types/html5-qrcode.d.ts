declare module 'html5-qrcode' {
  export class Html5QrcodeScanner {
    constructor(
      elementId: string,
      config: {
        fps: number;
        qrbox: { width: number; height: number };
      },
      verbose: boolean
    );

    render(
      successCallback: (decodedText: string) => void,
      errorCallback: (error: Error) => void
    ): void;

    clear(): void;
  }
} 