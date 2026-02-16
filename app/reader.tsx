import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { saveToHistory } from '@/src/history/storage';
import { getPdfRequire } from '@/src/lightnovels/asset-map';

export default function ReaderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    folder: string;
    pdf: string;
    title: string;
    seriesId?: string;
    seriesName?: string;
    coverFilename?: string;
    initialPage?: string;
  }>();
  const folder = params.folder ? decodeURIComponent(params.folder) : '';
  const pdfFilename = params.pdf ? decodeURIComponent(params.pdf) : '';
  const title = params.title ? decodeURIComponent(params.title) : 'Reader';
  const seriesId = params.seriesId ? decodeURIComponent(params.seriesId) : '';
  const seriesName = params.seriesName ? decodeURIComponent(params.seriesName) : '';
  const coverFilename = params.coverFilename ? decodeURIComponent(params.coverFilename) : '';
  const initialPage = params.initialPage ? parseInt(params.initialPage, 10) : 1;

  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);
  const [lastPage, setLastPage] = useState(initialPage);
  const [immersive, setImmersive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildPdfJsHtml = useCallback(
    (base64: string) => {
      const dataUrl = `data:application/pdf;base64,${base64}`;
      const startPage = Math.max(1, initialPage);
      return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=4,user-scalable=yes"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#1a1a1a;padding:8px}
    #pages{display:flex;flex-direction:column;align-items:center;gap:8px;padding-bottom:24px}
    #pages canvas{max-width:100%;height:auto;box-shadow:0 2px 8px rgba(0,0,0,0.4)}
    #load{color:#888;padding:24px;text-align:center}
  </style>
</head>
<body>
  <div id="load">Loading PDF…</div>
  <div id="pages"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    var pdfDataUrl = ${JSON.stringify(dataUrl)};
    var initialPageNum = ${startPage};
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    pdfjsLib.getDocument(pdfDataUrl).promise.then(function(pdf) {
      document.getElementById('load').style.display = 'none';
      var container = document.getElementById('pages');
      var scale = window.devicePixelRatio || 1.5;
      scale = Math.min(scale, 2.5);
      var canvases = [];
      function renderPage(num) {
        pdf.getPage(num).then(function(page) {
          var viewport = page.getViewport({ scale: scale });
          var canvas = document.createElement('canvas');
          canvas.setAttribute('data-page', String(num));
          var ctx = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.style.maxWidth = '100%';
          container.appendChild(canvas);
          canvases.push(canvas);
          page.render({ canvasContext: ctx, viewport: viewport });
          if (num < pdf.numPages) renderPage(num + 1);
          else {
            if (initialPageNum > 1 && canvases[initialPageNum - 1]) {
              canvases[initialPageNum - 1].scrollIntoView({ behavior: 'auto', block: 'start' });
            }
            function reportPage() {
              var scrollTop = window.scrollY || document.documentElement.scrollTop;
              var viewportMid = scrollTop + window.innerHeight / 2;
              var current = 1;
              for (var i = 0; i < canvases.length; i++) {
                var r = canvases[i].getBoundingClientRect();
                var top = r.top + scrollTop;
                var mid = top + r.height / 2;
                if (viewportMid >= top && viewportMid <= top + r.height) {
                  current = i + 1;
                  break;
                }
                if (mid <= viewportMid) current = i + 1;
              }
              if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'page', page: current }));
            }
            window.addEventListener('scroll', reportPage);
            reportPage();
          }
        });
      }
      renderPage(1);
    }).catch(function(err) {
      document.getElementById('load').textContent = 'Failed to load PDF: ' + err.message;
    });
  </script>
</body>
</html>`;
    },
    [initialPage]
  );

  const loadPdf = useCallback(async () => {
    const mod = getPdfRequire(folder, pdfFilename);
    if (!mod) {
      setError(
        'PDF not in asset map. Add a require() in src/lightnovels/asset-map.ts for this volume.'
      );
      setLoading(false);
      return;
    }
    try {
      const asset = Asset.fromModule(mod);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      if (!uri) {
        setError('Could not resolve PDF URI.');
        setLoading(false);
        return;
      }
      setLocalFileUri(uri);
      if (Platform.OS === 'web') {
        setPdfUri(uri);
      } else {
        // Use PDF.js in WebView so the PDF actually renders and scrolls (iOS/Android).
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        setPdfHtml(buildPdfJsHtml(base64));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load PDF');
    } finally {
      setLoading(false);
    }
  }, [folder, pdfFilename, buildPdfJsHtml]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  useEffect(() => {
    return () => {
      if (seriesId && seriesName && coverFilename && folder && pdfFilename && title) {
        saveToHistory({
          seriesId,
          seriesName,
          folder,
          pdfFilename,
          coverFilename,
          volumeTitle: title,
          lastPage,
        });
      }
    };
  }, [seriesId, seriesName, coverFilename, folder, pdfFilename, title, lastPage]);

  const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; page?: number };
      if (msg.type === 'page' && typeof msg.page === 'number') setLastPage(msg.page);
    } catch {
      // ignore
    }
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Could not open PDF</ThemedText>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ThemedText type="defaultSemiBold">Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {!immersive && (
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBack}>
            <ThemedText type="defaultSemiBold">← Back</ThemedText>
          </Pressable>
          <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.headerTitle}>
            {title}
          </ThemedText>
          <ThemedView style={styles.headerActions}>
            {localFileUri ? (
              <Pressable
                onPress={() => localFileUri && Linking.openURL(localFileUri)}
                style={styles.openExternallyButton}
              >
                <ThemedText type="defaultSemiBold">Open in system viewer</ThemedText>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setImmersive((i) => !i)}
              style={styles.immersiveButton}
            >
              <ThemedText type="defaultSemiBold">{immersive ? 'Show UI' : 'Immersive'}</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      )}
      {immersive && (
        <Pressable
          style={styles.immersiveTap}
          onPress={() => setImmersive(false)}
        />
      )}
      <ThemedView style={styles.webViewContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            src={pdfUri ?? ''}
            title={title}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <WebView
            source={pdfHtml ? { html: pdfHtml } : { uri: '' }}
            style={styles.webview}
            originWhitelist={['data:', 'file://', 'content://', 'https://']}
            scalesPageToFit
            startInLoadingState
            scrollEnabled
            nestedScrollEnabled
            onMessage={handleWebViewMessage}
          />
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  headerBack: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openExternallyButton: {
    padding: 4,
  },
  immersiveButton: {
    padding: 4,
  },
  immersiveTap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  webViewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
