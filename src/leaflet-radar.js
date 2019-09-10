L.Control.Radar = L.Control.extend({
        NEXRAD_URL:
                "https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi",
        NEXRAD_LAYER: "nexrad-n0q-900913",

        PLAY: "&#9658;",
        PAUSE: "&#9616;",
        isPaused: false,
        timeLayerIndex: 0,

        DEFAULT_OVERLAY_LAYER_OPTIONS: {
                format: "image/png",
                transparent: true,
                opacity: 0.575,
                zIndex: 200
        },

        _timeLayers: [],

        options: {
                opacity: 0.575,
                zIndex: 200,
                transitionMs: 750
        },

        initialize: function(options) {
                L.setOptions(this, options);
        },

        onRemove: function() {
                L.DomUtil.remove(this.container);
        },

        onAdd: function(map) {
                this.map = map;

                // setup control container
                this.container = L.DomUtil.create("div", "control_container");
                L.DomEvent.disableClickPropagation(this.container);
                L.DomEvent.on(this.container, "control_container", function(e) {
                        L.DomEvent.stopPropagation(e);
                });
                L.DomEvent.disableScrollPropagation(this.container);

                // add control elements within container
                this.checkbox = L.DomUtil.create(
                        "div",
                        "radar-toggle",
                        this.container
                );
                this.checkbox.innerHTML =
                        '<input id="radar-toggle" type="checkbox">Radar</input>';

                this.button = L.DomUtil.create(
                        "div",
                        "radar-button",
                        this.container
                );

                this.slider = L.DomUtil.create(
                        "div",
                        "radar-slider",
                        this.container
                );

                this.timestamp = L.DomUtil.create(
                        "div",
                        "radar-timestamp",
                        this.container
                );

                // register handlers
                this.checkbox.checked = false;
                this.checkbox.onclick = () => this._toggleRadar();

                return this.container;
        },

        _hideElement: function(el) {
                el.style.display = "none";
        },
        _showElement: function(el) {
                el.style.display = "block";
        },

        _removeRadar: function() {
                this._timeLayers.forEach(timeLayer =>
                        timeLayer.tileLayer.removeFrom(this.map)
                );
        },

        _addRadar: function() {
                this._timeLayers.forEach(timeLayer => {
                        timeLayer.tileLayer.setOpacity(0);
                        timeLayer.tileLayer.addTo(this.map);
                });
        },

        _hideAllTimeLayers: function() {
                this._timeLayers.forEach(timeLayer =>
                        timeLayer.tileLayer.setOpacity(0)
                );
        },

        _hideTimeLayerByIndex: function(index) {
                this._timeLayers[index].tileLayer.setOpacity(0);
                this.timestamp.innerText = "";
        },

        _showTimeLayerByIndex: function(index) {
                this._timeLayers[index].tileLayer.setOpacity(
                        this.options.opacity
                );
                this.timestamp.innerText = this._timeLayers[index].timestamp;
        },

        _toggleRadar: function() {
                if (!this.checkbox.checked) { // TODO always false, select input by ID
                        this._removeRadar();
                        return;
                }

                this._showElement(this.button);
                this._showElement(this.slider);
                this._showElement(this.timestamp);

                this._timeLayers = this._generateTimeLayers();
                this._addRadar(this._timeLayers);

                // calibrate slider
                // TODO set element attributes instead of inserting
                this.slider.innerHTML = `<input id="radar-slider" type="range" min="${0}" max="${this
                        ._timeLayers.length - 1}">`;

                this.timeLayerIndex = 0;
                this.isPaused = false;

                this.button.innerHTML = `<button id="radar-play">${
                        this.PAUSE
                }</button>`;
                this.slider.oninput = () => {
                        this.timeLayerIndex = +this.slider.value;

                        // hide all TODO or just the previous?
                        this._hideTimeLayers();

                        // show the selected
                        this._showTimeLayerByIndex(this.timeLayerIndex);
                        this._timeLayers.forEach(timeLayer => {
                                timeLayer.tileLayer.setOpacity(0);
                                timeLayer.tileLayer.addTo(this.map);
                        });

                        this._pause();
                };

                this.button.onclick = () => {
                        if (this.isPaused) {
                                this._play();
                                this._timeLayerTransitionTimer();
                        } else {
                                this._pause();
                        }
                };

                this._timeLayerTransitionTimer();
        },

        _pause: function() {
                this.button.innerHTML = `<button id="radar-button">${
                        this.PLAY
                }</button>`;
                this.isPaused = true;
        },

        _play: function() {
                this.button.innerHTML = `<button id="radar-play">${
                        this.PAUSE
                }</button>`;
                this.isPaused = false;
        },

        _timeLayerTransitionTimer: function() {
                setTimeout(() => {
                        if (this.isPaused) {
                                return;
                        }

                        this._timeLayers.forEach(timeLayer => {
                                timeLayer.tileLayer.setOpacity(0);
                                timeLayer.tileLayer.addTo(this.map);
                        });

                        // hide current layer
                        this._timeLayers[
                                this.timeLayerIndex
                        ].tileLayer.setOpacity(0);

                        this._incrementTimeLayerIndex();

                        if (this.checkbox.checked) {
                                this._showTimeLayerByIndex(this.timeLayerIndex);
                                this.slider.value = `${this.timeLayerIndex}`;
                                this._timeLayerTransitionTimer();
                        } else {
                                this._hideElement(this.button);
                                this._hideElement(this.timestamp);
                                this._hideElement(this.slider);
                        }
                }, this.options.transitionMs);
        },

        _incrementTimeLayerIndex: function() {
                this.timeLayerIndex++;
                if (this.timeLayerIndex > this._timeLayers.length - 1) {
                        this.timeLayerIndex = 0;
                }
        },

        _generateTimeLayers: function() {
                let timeLayers = [];

                const TOTAL_INTERVALS = 10;
                const INTERVAL_LENGTH_HRS = 5;

                const currentTime = new Date();

                for (let i = 0; i <= TOTAL_INTERVALS; i++) {
                        const timeDiffMins =
                                TOTAL_INTERVALS * INTERVAL_LENGTH_HRS -
                                INTERVAL_LENGTH_HRS * i;
                        if (timeDiffMins === 5) {
                                continue;
                        } // broken IDKY
                        const layerRequest =
                                this.NEXRAD_LAYER +
                                (!!timeDiffMins
                                        ? "-m" + timeDiffMins + "m"
                                        : "");
                        const layer = L.tileLayer.wms(this.NEXRAD_URL, {
                                layers: layerRequest,
                                ...this.DEFAULT_OVERLAY_LAYER_OPTIONS
                        });

                        const timeString = new Date(
                                currentTime.valueOf() - timeDiffMins * 60 * 1000
                        ).toLocaleTimeString();
                        timeLayers.push({
                                timestamp: `${timeString} (-${timeDiffMins} min)`,
                                tileLayer: layer
                        });
                }
                return timeLayers;
        }
});

L.control.radar = function(options) {
        return new L.Control.Radar(options);
};
