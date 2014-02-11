//SPARQL-GeoJSON v.0.2-alpha
function sparqlToGeoJSON(sparqlJSON) {
        'use strict';
        var bindingindex, varindex, geometryType, wkt, coordinates, property;
        var geojson = {
                "type": "FeatureCollection",
                "features": []
        };

        for (bindingindex = 0; bindingindex < sparqlJSON.results.bindings.length; ++bindingindex) {
                for (varindex = 0; varindex < sparqlJSON.head.vars.length; ++varindex) {
                        if (sparqlJSON.results.bindings[bindingindex][sparqlJSON.head.vars[varindex]] && sparqlJSON.results.bindings[bindingindex][sparqlJSON.head.vars[varindex]].datatype === "http://www.opengis.net/ont/geosparql#wktLiteral") {
                                //assumes the well-known text is valid!
                                wkt = sparqlJSON.results.bindings[bindingindex][sparqlJSON.head.vars[varindex]].value;

                                //chop off geometry type, already have that
                                coordinates = wkt.substr(wkt.indexOf("("), wkt.length);
                                //add extra [ and replace ( by [ 
                                coordinates = "[" + coordinates.split("(").join("[");
                                //replace ) by ] and add extra ]
                                coordinates = coordinates.split(")").join("]") + "]";
                                //replace , by ],[
                                coordinates = coordinates.split(",").join("],[");
                                //replace spaces with ,
                                coordinates = coordinates.split(" ").join(",");

                                //find substring left of first "(" occurrence for geometry type
                                switch (wkt.substr(0, wkt.indexOf("("))) {
                                case "POINT":
                                        geometryType = "Point";
					coordinates = coordinates.substr(1, coordinates.length - 2); //remove redundant [ and ] at beginning and end
                                        break;
                                case "MULTIPOINT":
                                        geometryType = "MultiPoint";
                                        break;
                                case "LINE":
                                        geometryType = "Line";
                                        break;
                                case "MULTILINE":
                                        geometryType = "MultiLine";
                                        break;
                                case "POLYGON":
                                        geometryType = "Polygon";
                                        break;
                                case "MULTIPOLYGON":
                                        geometryType = "MultiPolygon";
                                        break;
                                case "GEOMETRYCOLLECTION":
                                        geometryType = "GeometryCollection";
                                        break;
                                default:
                                        //invalid wkt!
                                        return {};
                                }
                                // Thijs Brentjens: now create a better properties-property of the feature
                                var props = {};
                                var allbindings = sparqlJSON.results.bindings[bindingindex];
                                for (var i in allbindings) {
                                    // if it is a WKT, then skip it
                                    if (allbindings[i]["datatype"] != "http://www.opengis.net/ont/geosparql#wktLiteral") {
                                        props[i] = allbindings[i]["value"];    
                                    }

                                }
                                var feature = {
                                        "type": "Feature",
                                        "geometry": {
                                                "type": geometryType,
                                                "coordinates": eval('(' + coordinates + ')')
                                        },
                                        "properties": props
                                };

                        geojson.features.push(feature);
                        }
                }
        }
        return geojson;
}
