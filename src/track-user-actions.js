/**
 * A pure javascript based plugin
 *
 * Purpose: To track user's behavior events in any given page.
 * It tracks clicks, mouse events, key events, time spent, node (html) click etc.
 *
 */

(function () {
  // namespace to track user behavior
  var trackUser = {};

  // Counter for generating unique local storage keys
  var sf

  // by default initials
  var initials = {
    clickCount: true,
    clickDetails: true,
    mouseMovement: true,
    context: true,  
    keyLog: true,
  };

  // For processing actions
  initials.actionItem = {
    processOnAction: false,
    selector: "",
    event: "",
  };
  initials.processTime = 15;
  initials.processData = function (endResult) {};

  // For end result - returned tracking JS object
  var endResult = {
    userInfo: {
      appCodeName: navigator.appCodeName || "",
      appName: navigator.appName || "",
      vendor: navigator.vendor || "",
      platform: navigator.platform || "",
      userAgent: navigator.userAgent || "",
    },
    time: {
      totalTime: 0,
      timeOnPage: 0,
    },
    clicks: {
      clickCount: 0,
      clickDetails: [],
    },
    mouseMovements: [],
    geoLocation: [],
    contextChange: [],
    keyLog: [],
  };

  // For supporting feature and settings
  var support = !!document.querySelector && !!document.addEventListener;
  var settings;
  const serverUrl = "http://localhost:3000/store-data";

  /**
   * Merge initials with options
   * @private
   * @param {Object} default settings + user options
   * @returns {Object} merged object
   */
  function getSettings(initials, options) {
    var option;
    for (option in options) {
      if (options.hasOwnProperty(option)) {
        initials[option] = options[option];
      }
    }
    return initials;
  }

  // Helper Functions
  var helperActions = {
    /**
     * Set the timer interval, will increment time on page if the user is
     * active on the page, totalTime counter always increments
     * @private
     */
    timer: function () {
      window.setInterval(function () {
        if (document["visibilityState"] === "visible") {
          endResult.time.timeOnPage++;
        }
        endResult.time.totalTime++;
      }, 1000);
    },

    /**
     * Detect the X,Y coordinates of the mouse movement
     * @private
     */
    mouseMovement: function () {
      document.addEventListener("mousemove", function () {
        endResult.mouseMovements.push({
          timestamp: Date.now(),
          x: event.pageX,
          y: event.pageY,
        });
      });
    },

    /**
     * Check if the user is navigating to a different page
     * @private
     */
    contextChange: function () {
      document.addEventListener("visibilitychange", function () {
        endResult.contextChange.push({
          timestamp: Date.now(),
          type: document["visibilityState"],
        });
      });
    },

    /**
     * Log the pasted information and keys pressed
     * @private
     */
    keyLog: function () {
      document.addEventListener("paste", function () {
        var pastedText = undefined;
        // Get Pasted Text
        if (window.clipboardData && window.clipboardData.getData) {
          pastedText = window.clipboardData.getData("Text");
        } else if (event.clipboardData && event.clipboardData.getData) {
          pastedText = event.clipboardData.getData("text/plain");
        }

        if (!!pastedText) {
          endResult.keyLog.push({
            timestamp: Date.now(),
            data: pastedText,
            type: "paste",
          });
        }
      });

      document.addEventListener("keyup", function () {
        var charCode = event.keyCode || event.which,
          charString = String.fromCharCode(charCode);

        endResult.keyLog.push({
          timestamp: Date.now(),
          data: charString,
          type: "keypress",
        });
      });
    },
  };

  // Function to send data to MongoDB (you need to implement this)
  function sendDataToMongoDB(data) {
    // Implement code to send data to MongoDB here
    // For example, you can use fetch or an HTTP request library
    fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) {
          console.log("Data sent to MongoDB successfully.");
        } else {
          console.error("Failed to send data to MongoDB.");
        }
      })
      .catch((error) => {
        console.error("Error sending data to MongoDB:", error);
      });

  }

  // Function to retrieve data from local storage, send to MongoDB, and clear local storage
  function retrieveAndSendData() {
    // Initialize an array to store data items
  var dataToSend = [];

  for (var i = 0; i < localStorage.length; i++) {
    var localStorageKey = localStorage.key(i);
    
    if (localStorageKey.indexOf('trackingData_') === 0) {
      // Check if the key matches the pattern for tracking data
      var data = JSON.parse(localStorage.getItem(localStorageKey));
      if (data) {
        dataToSend.push(data);
      }
    }
  }

  if (dataToSend.length > 0) {
    // Send the accumulated data to the server
    sendDataToMongoDB(dataToSend);

    // Clear local storage for the processed data items
    for (var i = 0; i < dataToSend.length; i++) {
      var keyToClear = "trackingData_" + storageCounter++;
      localStorage.removeItem(keyToClear);
    }
  }
  localStorage.clear();
  }

  // start the operations
  /**
   * Start the event listeners
   * @public
   * @param {Object} user options
   */
  function start(options) {
    if (!support) return;

    // Extend default options
    if (options && typeof options === "object") {
      settings = getSettings(initials, options);
    }

    // Set up an interval to call retrieveAndSendData every 15 seconds
    setInterval(retrieveAndSendData, 15000); // 15 seconds in milliseconds

    document.addEventListener("DOMContentLoaded", function () {
      // Countdown Timer
      window.setInterval(function () {
        if (document["visibilityState"] === "visible") {
          endResult.time.timeOnPage++;
        }
        endResult.time.totalTime++;
        // Check if we need to process endResult
        if (
          settings.processTime > 0 &&
          endResult.time.totalTime % settings.processTime === 0
        ) {
          processEndResults();
        }
      }, 1000);

      // Click registration, increment click counter and save click time+position
      if (settings.clickCount || settings.clickDetails) {
        document.addEventListener("mouseup", function () {
          if (settings.clickCount) {
            endResult.clicks.clickCount++;
          }
          if (settings.clickDetails) {
            endResult.clicks.clickDetails.push({
              timestamp: Date.now(),
              node: event.target.outerHTML,
              x: event.pageX,
              y: event.pageY,
            });
          }
        });
      }

      // Function to capture geolocation
      function captureGeolocation() {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            function (position) {
              endResult.geoLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
            },
            function (error) {
              console.error("Error getting geolocation:", error);
            }
          );
        } else {
          console.log("Geolocation is not supported in this browser.");
        }
      }

      // Call the function to capture geolocation
      captureGeolocation();

      // Mouse movements
      if (settings.mouseMovement) {
        helperActions.mouseMovement();
      }

      // Check context change
      if (settings.context) {
        helperActions.contextChange();
      }

      // Key Logger
      if (settings.keyLog) {
        helperActions.keyLog();
      }

      // Event Listener to process
      if (settings.actionItem.processOnAction) {
        var node = document.querySelector(settings.actionItem.selector);
        if (!!!node) throw new Error("Selector was not found.");
        node.addEventListener(settings.actionItem.event, function () {
          return processEndResults();
        });
      }
    });
  }

  // generating endResult
  /**
   * Calls provided function with endResult as parameter
   * @public
   */
  function processEndResults() {
    if (settings.hasOwnProperty("processData")) {
      // Generate a unique key for local storage
      var localStorageKey = "trackingData_" + storageCounter++;

      // Save endResult to local storage with the unique key
      localStorage.setItem(localStorageKey, JSON.stringify(endResult));

      // console.log("########################################");
      // console.log(endResult);

      // Send data to the server
    sendDataToMongoDB(endResult);


      return settings.processData.call(undefined, endResult);
    }
    return false;
  }

  // attaching stuffs on namespace
  // only expose necessary methds
  trackUser.start = start;
  trackUser.processEndResults = processEndResults;

  // exporting namespace via window
  window.trackUser = trackUser;
})();
