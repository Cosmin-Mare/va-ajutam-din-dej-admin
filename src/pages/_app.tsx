import type { AppProps } from 'next/app';
import Head from 'next/head';
import './globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="theme-color" content="#cb0068" />
        <meta name="color-scheme" content="light" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
