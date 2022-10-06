import React from 'react';

import mongoose from 'mongoose';
import Document, {
  DocumentContext, DocumentInitialProps,
  Html, Head, Main, NextScript,
} from 'next/document';

import { ActivatePluginService, GrowiPluginManifestEntries } from '~/client/services/activate-plugin';
import { GrowiPlugin, GrowiPluginResourceType } from '~/interfaces/plugin';


// FIXME: dummy data
// ------------------
const growiPluginsExample: GrowiPlugin[] = [
  {
    isEnabled: true,
    installedPath: 'weseek/growi-plugin-copy-code-to-clipboard',
    origin: {
      url: 'https://github.com/weseek/growi-plugin-copy-code-to-clipboard',
    },
    meta: {
      name: 'weseek/growi-plugin-copy-code-to-clipboard',
      types: [GrowiPluginResourceType.Script],
    },
  },
];
// ------------------


type HeadersForGrowiPluginProps = {
  pluginManifestEntries: GrowiPluginManifestEntries;
}

const HeadersForGrowiPlugin = (props: HeadersForGrowiPluginProps): JSX.Element => {
  const { pluginManifestEntries } = props;

  return (
    <>
      { pluginManifestEntries.map(([growiPlugin, manifest]) => {
        // type: script
        if (growiPlugin.meta.types.includes(GrowiPluginResourceType.Script)) {
          return (
            <>
              <link rel="stylesheet" key={`link_${growiPlugin.installedPath}`}
                href={`/plugins/${growiPlugin.installedPath}/dist/${manifest['client-entry.tsx'].css}`} />
              {/* eslint-disable-next-line @next/next/no-sync-scripts */ }
              <script type="module" key={`script_${growiPlugin.installedPath}`}
                src={`/plugins/${growiPlugin.installedPath}/dist/${manifest['client-entry.tsx'].file}`} />
            </>
          );
        }
        return <></>;
      }) }
    </>
  );
};

interface GrowiDocumentProps {
  pluginManifestEntries: GrowiPluginManifestEntries;
}
declare type GrowiDocumentInitialProps = DocumentInitialProps & GrowiDocumentProps;

class GrowiDocument extends Document<GrowiDocumentProps> {

  static override async getInitialProps(ctx: DocumentContext): Promise<GrowiDocumentInitialProps> {
    const initialProps: DocumentInitialProps = await Document.getInitialProps(ctx);

    // TODO: load GrowiPlugin documents from DB
    const GrowiPlugin = mongoose.model<GrowiPlugin>('GrowiPlugin');
    const growiPlugins = await GrowiPlugin.find({ isEnabled: true });
    const pluginManifestEntries: GrowiPluginManifestEntries = await ActivatePluginService.retrievePluginManifests(growiPlugins);

    return { ...initialProps, pluginManifestEntries };
  }

  override render(): JSX.Element {

    const { pluginManifestEntries } = this.props;

    return (
      <Html>
        <Head>
          {/*
          {renderScriptTagsByGroup('basis')}
          {renderStyleTagsByGroup('basis')}
          */}
          <HeadersForGrowiPlugin pluginManifestEntries={pluginManifestEntries} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }

}

export default GrowiDocument;
