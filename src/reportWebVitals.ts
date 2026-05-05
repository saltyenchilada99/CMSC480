import type { ReportHandler } from 'web-vitals';

/**
 * Optional CRA performance hook.
 *
 * The app does not report metrics by default, but passing a callback here lets
 * a developer log or forward Core Web Vitals without changing the app entry.
 */
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
