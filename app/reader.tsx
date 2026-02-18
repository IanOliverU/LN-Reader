import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useThemeColor } from '@/hooks/use-theme-color';
import { saveToHistory } from '@/src/history/storage';
import { getPdfRequire } from '@/src/lightnovels/asset-map';
import { addPagesReadToday } from '@/src/stats/storage';

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
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [immersive, setImmersive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tintColor = useThemeColor({}, 'tint');
  const lastPageRef = useRef(lastPage);
  lastPageRef.current = lastPage;

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
      var renderTask = pdf.getPage(1).then(function(firstPage) {
        var vp = firstPage.getViewport({ scale: scale });
        for (var i = 0; i < pdf.numPages; i++) {
          var c = document.createElement('canvas');
          c.setAttribute('data-page', String(i + 1));
          c.height = vp.height;
          c.width = vp.width;
          c.style.maxWidth = '100%';
          container.appendChild(c);
          canvases.push(c);
        }
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'numPages', numPages: pdf.numPages }));
        function renderOne(num, onDone) {
          pdf.getPage(num).then(function(page) {
            var viewport = page.getViewport({ scale: scale });
            var canvas = canvases[num - 1];
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise.then(onDone);
          });
        }
        function doScroll() {
          if (initialPageNum > 1 && canvases[initialPageNum - 1]) {
            var target = canvases[initialPageNum - 1];
            target.scrollIntoView({ behavior: 'auto', block: 'start' });
            var y = target.getBoundingClientRect().top + (window.scrollY || document.documentElement.scrollTop) - 16;
            window.scrollTo(0, Math.max(0, y));
          }
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
        if (initialPageNum > 1) {
          renderOne(initialPageNum, function() {
            doScroll();
            setTimeout(doScroll, 50);
            setTimeout(doScroll, 300);
            for (var n = 1; n <= pdf.numPages; n++) {
              if (n !== initialPageNum) renderOne(n, function() {});
            }
          });
        } else {
          for (var n = 1; n <= pdf.numPages; n++) renderOne(n, function() {});
        }
      }).catch(function() {});
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

  // Save history and pages-read stats only on unmount (when user leaves reader)
  useEffect(() => {
    return () => {
      const currentLastPage = lastPageRef.current;
      if (seriesId && seriesName && coverFilename && folder && pdfFilename && title) {
        saveToHistory({
          seriesId,
          seriesName,
          folder,
          pdfFilename,
          coverFilename,
          volumeTitle: title,
          lastPage: currentLastPage,
        });
      }
      const pagesRead = Math.max(0, currentLastPage - initialPage);
      addPagesReadToday(pagesRead);
    };
  }, []); // Empty deps = cleanup only runs on unmount

  const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; page?: number; numPages?: number };
      if (msg.type === 'page' && typeof msg.page === 'number') setLastPage(msg.page);
      if (msg.type === 'numPages' && typeof msg.numPages === 'number') setTotalPages(msg.numPages);
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
        <ThemedView style={styles.headerWrap}>
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
        {Platform.OS !== 'web' && totalPages != null && totalPages > 0 && (
          <ThemedView style={styles.progressSection}>
            <ThemedText style={styles.progressText}>
              You are {Math.round((lastPage / totalPages) * 100)}% through {title}
            </ThemedText>
            <ThemedView style={styles.progressRow}>
              <ThemedText style={styles.pageIndicator}>
                Page {lastPage} of {totalPages}
              </ThemedText>
              <ThemedView style={styles.progressTrack}>
              <ThemedView
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, (lastPage / totalPages) * 100)}%`,
                    backgroundColor: tintColor,
                  },
                ]}
              />
            </ThemedView>
            </ThemedView>
          </ThemedView>
        )}
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
  headerWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  progressSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.3)',
  },
  progressText: {
    fontSize: 13,
    opacity: 0.9,
    marginBottom: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageIndicator: {
    fontSize: 12,
    opacity: 0.9,
    minWidth: 70,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(128,128,128,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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
