/**
 * Network utilities for monitoring connection status
 */

let networkMonitorInstance = null;

export const getNetworkMonitor = () => {
  if (!networkMonitorInstance) {
    networkMonitorInstance = {
      subscribers: [],

      subscribe(callback) {
        this.subscribers.push(callback);
        // Send initial status
        callback(navigator.onLine ? "online" : "offline");

        return () => {
          this.subscribers = this.subscribers.filter((s) => s !== callback);
        };
      },

      notify(status) {
        this.subscribers.forEach((cb) => cb(status));
      },
    };

    // Setup listeners
    window.addEventListener("online", () => {
      networkMonitorInstance.notify("online");
    });

    window.addEventListener("offline", () => {
      networkMonitorInstance.notify("offline");
    });
  }

  return networkMonitorInstance;
};
