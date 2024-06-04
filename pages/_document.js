// pages/_document.js

import { ColorModeScript } from "@chakra-ui/react";
import NextDocument, { Html, Head, Main, NextScript } from "next/document";
import theme from "../components/theme";

export default class Document extends NextDocument {
    render() {
        return (
            <Html lang="en">
                <Head>
                    <link
                        rel="apple-touch-icon"
                        href="https://irp.cdn-website.com/a01407ef/dms3rep/multi/vtru-white.png"
                    />
                    <link
                        rel="icon"
                        type="image/x-icon"
                        href="https://irp.cdn-website.com/a01407ef/site_favicon_16_1710139547800.ico"
                    />
                </Head>
                <body>
                    <ColorModeScript
                        initialColorMode={theme.config.initialColorMode}
                    />
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
