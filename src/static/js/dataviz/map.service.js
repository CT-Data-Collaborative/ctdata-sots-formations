angular.module('app')
.service('mapService', ['$q', '$http', 'lodash', function($q, $http, lodash) {
    var mapService = {};

    mapService.chartQuintiles = function(container, data, config) {
        var NA_COLOR = "#FAFAFA";
        var HEX_COLORS = [
            "#edf8b1",
            "#A1DAB4",
            "#41B6C4",
            "#2C7FB8",
            "#253494"
        ];

        var timeFormats = {
            "year" : "YYYY",
            "quarter" : "[Q]Q YYYY",
            "month" : "MMM YYYY"
        };
        // code from Shopify (see gist: https://gist.github.com/jlbruno/1535691)
        var quintileFormat = function(q) {
            var suffixes = ["th","st","nd","rd"];
            var suffixIndex = q % 100;
            return q + (suffixes[(suffixIndex - 20) % 10] || suffixes[suffixIndex] || suffixes[0]) + " Quintile";
        };

        config.chartFacet = lodash.difference(["structure", "time"], [config.facet])[0]

        var legendData = d3.range(1,6).map(quintileFormat);
        legendData = [["No Data"]].concat(legendData);

        // create container for maps
        mapContainer = d3.select(container)
            .append("div")
            .classed("map-container", true)
            .append("div")
            .classed("map-container-internal", true);

        // create container for legends
        legendContainer = d3.select(container)
            .append("div")
            .classed("legend-container", true);

        // mapContainer.append("pre")
            // .text(JSON.stringify(data, null, 4));
            // .text(JSON.stringify(config, null, 4));
            // .text(JSON.stringify(GEO_DATA[config.geography], null, 4));
            // .text(JSON.stringify(scaleData, null, 4));
            // .text(JSON.stringify(legendData, null, 4));
        // return;

        var mapDivs = mapContainer.selectAll("div.map")
            .data(data)
            .enter()
            .append("div")
                .classed("map", true);

        makeMaps(mapDivs);

        var legendDiv = legendContainer.selectAll("div.legend")
            .data([legendData])
            .enter()
            .append("div")
                .classed("legend", true)

        makeLegend(legendDiv);

        // // if we are under a certain pixel size, there will be horizontal scrolling
        var internalContainerSize = d3.select(container).select("div.map-container-internal").node().getBoundingClientRect(),
            containerSize = d3.select(container).select("div.map-container").node().getBoundingClientRect();

        // console.log(internalContainerSize.height + " / " + containerSize.height)

        if (internalContainerSize.height > containerSize.height) {
            // create scroll notice
            var scrollNotice = d3.select(container).select("div.map-container")
                .append("div")
                .classed("scroll-notice", true)
                    .append("p");

            scrollNotice.append("i")
                .classed({
                    "fa" : true,
                    "fa-angle-double-down " : true
                });

            scrollNotice.append("span")
                .text("Scroll down for more");

            scrollNotice.append("i")
                .classed({
                    "fa" : true,
                    "fa-angle-double-down " : true
                });
        }

        var mapHeight = mapContainer.select("div.map").node().getBoundingClientRect().height;
        d3.select(container).selectAll("div.map-container").on("scroll", function() {
            // if scroll at bottom, hide scroll notice
            // using a different class so as not to interfere with the mouseover effects
            if ((d3.select(this).node().scrollTop + d3.select(this).node().offsetHeight) >= (d3.select(this).node().scrollHeight - (mapHeight/2))) {
                d3.select(container).selectAll("div.scroll-notice")
                    .classed({
                        "hidden" : true
                    });
            } else {
                d3.select(container).selectAll("div.scroll-notice")
                    .classed({
                        "hidden" : false
                    });
            }
        })

        // add hover effects - use classes "highlight" and "lowlight"
        // d3.select(container).selectAll("g.mapgroup > path.mappath")
        // .on("mouseover", function() {
        //     var classToHighlight = d3.select(this.parentNode).attr("data-geography");

        //     // lowlight all elements
        //     d3.select(container).selectAll("g.mapgroup > path.mappath, g.mapgroup > text.mapinfo, div.scroll-notice, table.ctdata-table > tbody > tr")
        //     .classed({
        //         "lowlight" : true,
        //         "highlight" : false
        //     });
            
        //     // highlight all elements with matching data-geography as a class
        //     d3.select(container).selectAll("g.mapgroup." + classToHighlight + " > path.mappath, g.mapgroup." + classToHighlight + " > text.mapinfo, table.ctdata-table > tbody > tr." + classToHighlight)
        //     .classed({
        //         "lowlight" : false,
        //         "highlight" : true
        //     });
        // })
        // .on("mouseout", function() {
        //     // remove all highlight/lowlight classes
        //     d3.select(container).selectAll("g.mapgroup > path.mappath, g.mapgroup > text.mapinfo, div.scroll-notice, table.ctdata-table > tbody > tr")
        //     .classed({
        //         "lowlight" : false,
        //         "highlight" : false
        //     });
        // });

        function makeLegend(selection) {
            selection.each(function(data) {
                var BBox = this.getBoundingClientRect(),
                    margin = {
                        "top" : BBox.height * 0.18,
                        "right" : BBox.width * 0.1,
                        "bottom" : BBox.height * 0.05,
                        "left" : BBox.width * 0.1
                    },
                    width = BBox.width - (margin.left + margin.right)
                    height = BBox.height - (margin.top + margin.bottom),
                    svg = d3.select(this).append("svg")
                        .attr("height", BBox.height)
                        .attr("width", BBox.width)
                        .attr("font-weight", 300)
                        .attr("font-size", "1rem")
                        .attr("xmlns", "http://www.w3.org/2000/svg")
                        .attr("transform", "translate(0, 0)"),
                    numberFormat = d3.format(",d"),
                    decimalFormat = d3.format(",.2f"),
                    percentFormat = function(v) {
                        return numberFormat(v) + "%"
                    },
                    breaks = data,
                    colors = d3.scale.ordinal()
                        .domain(d3.range(breaks.length))
                        .range([NA_COLOR].concat(HEX_COLORS));

                var legendTitle = svg.append("text")
                    .text("Legend")
                    .attr("transform", "translate(12, 20)");

                var legendInfo = legendTitle.append("tspan")
                    .attr("dx", 6)
                    .classed({
                        "fa" : true,
                        "legend-info-icon" : true
                    })
                    .text("\uF05A");

                legendInfo.each(function() {
                    new Tooltip({
                        target: this,
                        content: "<p>Quintiles are subsets of data that represent 20% of the given values. The first quintile represents the lowest fifth of the data (1-20%); the second quintile represents the second fifth (21%-40%), and so on.</p> <p>Values within each graphic are grouped with respect to the other values within that graphic alone. For example, if you've selected 2013 and 2014, the quintiles for each year only include data from that year. This allows you to compare which quintile a geographic unit is in over multiple years.</p>",
                        classes: "sots-tooltip"
                    });
                });

                var legend = svg.append("g")
                    .classed("legend", true)
                    .attr("height", height)
                    .attr("width", width)
                    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

                var legendBoxes = legend.selectAll("rect")
                    .data(breaks)
                    .enter()
                    .append("rect")
                        .attr("stroke-width", "0.5px")
                        .attr("stroke", "#202020")
                        .attr("fill", function(d, i) {
                            return colors(i);
                        })
                        .attr("height", "16px")
                        .attr("width", "16px")
                        .attr("x", 0)
                        //                                              16 px box + 3px padding
                        .attr("y", function(d, i) { return ((16*i)+(3 * (i-1)))+"px"});

                var legendText = legend.selectAll("text")
                    .data(breaks)
                    .enter()
                    .append("text")
                        .attr("fill", "#4A4A4A")
                        //                                              16 px box + 3px padding
                        //                                              the extra i+1 is to account for baseline height for text
                        .attr("dy", function(d, i) { return 16 * (i + 1) + (3 * (i - 1))})
                        .attr("dx", "18px")
                        .text(function(d, i) {
                            // if (i == 0) {
                                return d;
                            // }
                            // return d.map(function(v){ return percentFormat(v); }).join(" - ");
                        });
            });
        }

        function makeMaps(selection) {
            selection.each(function(data, index) {
                var geoJoinedData = {
                    "type" : "FeatureCollection",
                    "features" : GEO_DATA[config.geography].features.map(function(feature, index, features) {
                        feature.properties.DATAVALUE = lodash.chain(data.values).find({"key" : feature.properties.NAME}).result("values").value()
                        return feature;
                    })
                };

                // stuff we need to draw maps
                var BBox = this.getBoundingClientRect(),
                    margin = {
                        "top" : BBox.height * 0.05,
                        "right" : BBox.width * 0.1,
                        "bottom" : BBox.height * 0.05,
                        "left" : BBox.width * 0.1
                    },
                    width = BBox.width - (margin.left + margin.right)
                    height = BBox.height - (margin.top + margin.bottom),
                    svg = d3.select(this).append("svg")
                        .attr("height", BBox.height)
                        .attr("width", BBox.width)
                        .attr("transform", "translate(0, 0)"),
                    map = svg.append("g")
                        .attr("height", height)
                        .attr("width", width)
                        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")"),
                    sluggify = function(text)  {
                        return text.toLowerCase().replace(/\W/g, "_");
                    },
                    numberFormat = d3.format(",d"),
                    decimalFormat = d3.format(",.2f"),
                    percentFormat = function(v) {
                        return numberFormat(v) + "%"
                    },
                    scaleData = lodash.chain(data.values)
                        .pluck("values")
                        .uniq()
                        .sortBy()
                        .value(),
                    colors = d3.scale.quantile()
                        .domain(scaleData)
                        .range(HEX_COLORS),
                    projection = d3.geo.equirectangular()
                            .scale(1)
                            .translate([0,0]),
                    path = d3.geo.path().projection(projection),
                    bounds  = path.bounds(geoJoinedData),
                        hscale = (bounds[1][0] - bounds[0][0]) / width,
                        vscale = (bounds[1][1] - bounds[0][1]) / height,
                        scale = 1 / Math.max(hscale, vscale),
                        translate = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];

                projection.scale(scale).translate(translate);

                var places = map.selectAll("path")
                    .data(geoJoinedData.features)
                    .enter()
                    .append("g")
                        .attr("class", function(d){
                            return [
                                "mapgroup",
                                "hover",
                                sluggify(d.properties.NAME)
                            ].join(" ");
                        })
                        .attr("data-geography", function(d) {
                            return sluggify(d.properties.NAME);
                        })
                        .datum(function(d) { return d; });

                places.each(function() {
                    // the actual map piece
                    d3.select(this)
                        .append("path")
                        .attr("d", path)
                        .classed("mappath", true)
                        .attr("fill", function(d) {
                            if (d.properties.DATAVALUE == null) {
                                return NA_COLOR;
                            }
                            return colors(d.properties.DATAVALUE);
                        });

                    // text to say what geo and its value
                    d3.select(this)
                        .append("text")
                            .classed("mapinfo", true)
                            .attr("x", width)
                            .attr("y", margin.top)
                            .attr("text-anchor", "end")
                            .text(function(d) {
                                var label = d.properties.NAME+": ";

                                if (d.properties.DATAVALUE === null) {
                                    label += "No Data";
                                } else {
                                    label += numberFormat(d.properties.DATAVALUE);
                                }

                                return label
                            })
                })

                // Put year under map
                var facetLabel = svg.append("g")
                    .attr("transform", "translate(" + (margin.left + (width / 2)) + ", " + height + ")")
                    .append("text")
                        .attr("text-anchor", "middle")
                        .text(function() {
                            if (config.chartFacet == "time") {
                                data.key = moment(data.key, timeFormats[config.time]).format(timeFormats[config.time]);
                            }
                            return data.key
                        });
            });
        }
    }

    mapService.chartCKMeans = function(container, data, config) {

        var NA_COLOR = "#FAFAFA";
        var HEX_COLORS = [
            "#edf8b1",
            "#A1DAB4",
            "#41B6C4",
            "#2C7FB8",
            "#253494"
        ];

        var timeFormats = {
            "year" : "YYYY",
            "quarter" : "[Q]Q YYYY",
            "month" : "MMM YYYY"
        };

        config.chartFacet = lodash.difference(["structure", "time"], [config.facet])[0]

        var scaleData = lodash.chain(data)
            .pluck("values")
            .flatten()
            .pluck("values")
            .uniq()
            .sortBy()
            .value()
            .filter(function(d) { return d > 0; });
        var scaleBreaks = ss.ckmeans(
            scaleData,
            d3.min([5, scaleData.length])
        ).map(function(cluster) { return d3.extent(cluster); });

        data.forEach(function(o, oi, oa) {
            data[oi].breaks = scaleBreaks;
        })

        // create container for maps
        mapContainer = d3.select(container)
            .append("div")
            .classed("map-container", true)
            .append("div")
            .classed("map-container-internal", true);

        // create container for legends
        legendContainer = d3.select(container)
            .append("div")
            .classed("legend-container", true);

        // mapContainer.append("pre")
            // .text(JSON.stringify(data, null, 4));
            // .text(JSON.stringify(config, null, 4));
            // .text(JSON.stringify(GEO_DATA[config.geography], null, 4));
            // .text(JSON.stringify(scaleData, null, 4));
            // .text(JSON.stringify(scaleBreaks, null, 4));
        // return;

        var mapDivs = mapContainer.selectAll("div.map")
            .data(data)
            .enter()
            .append("div")
                .classed("map", true);

        makeMaps(mapDivs);

        var legendDiv = legendContainer.selectAll("div.legend")
            .data([scaleBreaks])
            .enter()
            .append("div")
                .classed("legend", true)

        makeLegend(legendDiv);

        // // if we are under a certain pixel size, there will be horizontal scrolling
        var internalContainerSize = d3.select(container).select("div.map-container-internal").node().getBoundingClientRect(),
            containerSize = d3.select(container).select("div.map-container").node().getBoundingClientRect();

        // console.log(internalContainerSize.height + " / " + containerSize.height)

        if (internalContainerSize.height > containerSize.height) {
            // create scroll notice
            var scrollNotice = d3.select(container).select("div.map-container")
                .append("div")
                .classed("scroll-notice", true)
                    .append("p");

            scrollNotice.append("i")
                .classed({
                    "fa" : true,
                    "fa-angle-double-down " : true
                });

            scrollNotice.append("span")
                .text("Scroll down for more");

            scrollNotice.append("i")
                .classed({
                    "fa" : true,
                    "fa-angle-double-down " : true
                });
        }

        var mapHeight = mapContainer.select("div.map").node().getBoundingClientRect().height;
        d3.select(container).selectAll("div.map-container").on("scroll", function() {
            // if scroll at bottom, hide scroll notice
            // using a different class so as not to interfere with the mouseover effects
            if ((d3.select(this).node().scrollTop + d3.select(this).node().offsetHeight) >= (d3.select(this).node().scrollHeight - (mapHeight/2))) {
                d3.select(container).selectAll("div.scroll-notice")
                    .classed({
                        "hidden" : true
                    });
            } else {
                d3.select(container).selectAll("div.scroll-notice")
                    .classed({
                        "hidden" : false
                    });
            }
        })

        function makeLegend(selection) {
            selection.each(function(data) {
                var BBox = this.getBoundingClientRect(),
                    margin = {
                        "top" : BBox.height * 0.15,
                        "right" : BBox.width * 0.1,
                        "bottom" : BBox.height * 0.05,
                        "left" : BBox.width * 0.1
                    },
                    width = BBox.width - (margin.left + margin.right)
                    height = BBox.height - (margin.top + margin.bottom),
                    svg = d3.select(this).append("svg")
                        .attr("height", BBox.height)
                        .attr("width", BBox.width)
                        .attr("font-weight", 300)
                        .attr("font-size", "1rem")
                        .attr("xmlns", "http://www.w3.org/2000/svg")
                        .attr("transform", "translate(0, 0)"),
                    numberFormat = d3.format(",d"),
                    breaks = data,
                    colors = d3.scale.ordinal()
                        // .domain(d3.range(breaks.length))
                        .range(HEX_COLORS),
                    jenks = d3.scale.threshold()
                        .domain(breaks.map(function(cluster) {return cluster[0];}))
                        .range([NA_COLOR].concat(d3.range(breaks.length).map(function(i) { return colors(i); })));

                var legendData = jenks.range().map(function(color, index) {
                    if (index === 0) {
                        return []
                    } else {
                        return breaks[index-1];
                    }
                });

                var legendTitle = svg.append("text")
                    .text("Legend")
                    .attr("transform", "translate(12, 20)");

                var legend = svg.append("g")
                    .classed("legend", true)
                    .attr("height", height)
                    .attr("width", width)
                    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");


                var legendBoxes = legend.selectAll("rect")
                    .data(legendData)
                    .enter()
                    .append("rect")
                        .attr("stroke-width", "0.5px")
                        .attr("stroke", "#202020")
                        // if using predefined color pallette
                        .attr("fill", function(d, i) {
                            return d.length > 0 ? jenks(d[0]) : jenks(-1);
                        })
                        .attr("height", "16px")
                        .attr("width", "16px")
                        .attr("x", 0)
                        //                                              16 px box + 3px padding
                        .attr("y", function(d, i) { return ((16*i)+(3 * (i-1)))+"px"});

                var legendText = legend.selectAll("text")
                    .data(legendData)
                    .enter()
                    .append("text")
                        .attr("fill", "#4A4A4A")
                        //                                              16 px box + 3px padding
                        //                                              the extra i+1 is to account for baseline height for text
                        .attr("dy", function(d, i) { return 16 * (i + 1) + (3 * (i - 1))})
                        .attr("dx", "18px")
                        .text(function(d, i) {
                            if (d.length === 0) {
                                return "0"
                            } else if (d[0] === d[1]) {
                                return numberFormat(d[0]);
                            } else {
                                return d.map(function(v){ return numberFormat(v); }).join(" - ");
                            }
                        });
            });
        }

        function makeMaps(selection) {
            selection.each(function(data, index) {
                var geoJoinedData = {
                    "type" : "FeatureCollection",
                    "features" : GEO_DATA[config.geography].features.map(function(feature, index, features) {
                        feature.properties.DATAVALUE = lodash.chain(data.values).find({"key" : feature.properties.NAME}).result("values").value()
                        return feature;
                    })
                };

                // stuff we need to draw maps
                var BBox = this.getBoundingClientRect(),
                    margin = {
                        "top" : BBox.height * 0.05,
                        "right" : BBox.width * 0.1,
                        "bottom" : BBox.height * 0.05,
                        "left" : BBox.width * 0.1
                    },
                    width = BBox.width - (margin.left + margin.right)
                    height = BBox.height - (margin.top + margin.bottom),
                    svg = d3.select(this).append("svg")
                        .attr("height", BBox.height)
                        .attr("width", BBox.width)
                        .attr("transform", "translate(0, 0)"),
                    map = svg.append("g")
                        .attr("height", height)
                        .attr("width", width)
                        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")"),
                    sluggify = function(text)  {
                        return text.toLowerCase().replace(/\W/g, "_");
                    },
                    numberFormat = d3.format(",d"),
                    breaks = data.breaks,
                    colors = d3.scale.ordinal()
                        // .domain(d3.range(breaks.length))
                        .range(HEX_COLORS),
                    jenks = d3.scale.threshold()
                        .domain(breaks.map(function(cluster) {return cluster[0];}))
                        .range(["#FAFAFA"].concat(d3.range(breaks.length).map(function(i) { return colors(i); }))),
                    projection = d3.geo.equirectangular()
                            .scale(1)
                            .translate([0,0]),
                    path = d3.geo.path().projection(projection),
                    bounds  = path.bounds(geoJoinedData),
                        hscale = (bounds[1][0] - bounds[0][0]) / width,
                        vscale = (bounds[1][1] - bounds[0][1]) / height,
                        scale = 1 / Math.max(hscale, vscale),
                        translate = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];

                projection.scale(scale).translate(translate);

                var places = map.selectAll("path")
                    .data(geoJoinedData.features)
                    .enter()
                    .append("g")
                        .attr("class", function(d){
                            return [
                                "mapgroup",
                                "hover",
                                sluggify(d.properties.NAME)
                            ].join(" ");
                        })
                        .attr("data-geography", function(d) {
                            return sluggify(d.properties.NAME);
                        })
                        .datum(function(d) { return d; });

                places.each(function() {
                    d3.select(this)
                        ;
                    
                    // the actual map piece
                    d3.select(this)
                        .append("path")
                        .attr("d", path)
                        .classed("mappath", true)
                        .attr("fill", function(d) {
                            return jenks(d.properties.DATAVALUE || null);
                        });

                    // text to say what geo and its value
                    d3.select(this)
                        .append("text")
                            .classed("mapinfo", true)
                            .attr("x", width)
                            .attr("y", margin.top)
                            .attr("text-anchor", "end")
                            .text(function(d) {
                                return d.properties.NAME+": "+numberFormat(d.properties.DATAVALUE);
                            })
                })

                // Put year under map
                var facetLabel = svg.append("g")
                    .attr("transform", "translate(" + (margin.left + (width / 2)) + ", " + height + ")")
                    .append("text")
                        .attr("text-anchor", "middle")
                        .text(function() {
                            if (config.chartFacet == "time") {
                                data.key = moment(data.key, timeFormats[config.time]).format(timeFormats[config.time]);
                            }
                            return data.key
                        });
            });
        }
    }


    return mapService;
}])
