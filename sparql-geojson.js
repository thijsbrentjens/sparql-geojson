//SPARQL-GeoJSON v.0.2-alpha
function sparqlToGeoJSON(sparqlJSON) {
        'use strict';
        var bindingindex, varindex, geometryType, wkt, coordinates, property;
        var geojson = {
                "type": "FeatureCollection",
                "features": []
        };
        // base context
        var linkedDataContext = {
            "Feature":"http://geovocab.org/spatial#Feature",
            "FeatureCollection":"rdfs:Resource", // is this the resource?
            "GeometryCollection":"http://geovocab.org/geometry#GeometryCollection",
             // add all geometry-types by default, so different types of geometries should not be a problem
            "Point":"http://geovocab.org/geometry#Point",
            "LineString":"http://geovocab.org/geometry#LineString",
            "Polygon":"http://geovocab.org/geometry#Polygon",
            "MultiPoint":"http://geovocab.org/geometry#MultiPoint",
            "MultiLineString":"http://geovocab.org/geometry#MultiLineString",
            "MultiPolygon":"http://geovocab.org/geometry#MultiPolygon",
            "coordinates":{
              "@id":"http://example.org/geojsonUnorderedCoordArrayMember" // TODO: find a better type here. What is an array of ordinates? Should there be a vocab or a definition of it's own for this. Or is this just a (multi-)list of numbers?
            },
            "features":"rdfs:Resource",
            "geometry":"http://geovocab.org/geometry#geometry",
            "id":"@id", // TODO: provide an id per feature? How to do this?
            "properties":{
              "@id":"rdfs:isDefinedBy"
            },
            "type":"@type"
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
                                // Thijs: now create a more suitable list properties of the feature
                                // Better align with GeoJSON setup
                                var props = {};
                                var allbindings = sparqlJSON.results.bindings[bindingindex];
                                for (var i in allbindings) {
                                    // console.log(i + ", " + allbindings[i]["type"] + " --> " + allbindings[i] ["value"])
                                    // for building the context, create a property using head and all datatypes. Datatypes can be assigned here.
                                    // if it is a WKT, then skip it
                                    if (allbindings[i]["datatype"] != "http://www.opengis.net/ont/geosparql#wktLiteral") {
                                        props[i] = allbindings[i]["value"];    
                                    }
                                    // now create the linked data context for the properties provided
                                    if (linkedDataContext[i] == undefined) {
                                        // Add a local reference for now
                                        // TODO: how to deal with this, from a sparql response?
                                        var ns = ""
                                        if (i.indexOf("http://")!=0) {
                                            ns = "http://example.com/#";
                                        }
                                        switch (allbindings[i]["type"]) {
                                            case "typed-literal":
                                                // this should have datatype, that is defined by an id? Is his always the case?
                                                linkedDataContext[i] = {"@id": ns + i,"@type":allbindings[i]["datatype"]};// {"@id":allbindings[i]["datatype"]}; // now: {"@id":""}
                                                break;
                                            case "uri":
                                                // TODO: how to say this is a URI
                                                linkedDataContext[i] = {"@id": ns + i, "@type":"@id"}; // the type is defined by the URI (id) .. Or use: "@id":allbindings[i]["value"] as well?
                                                break;
                                            case "literal":
                                                // the type is defined by the URI (id) .. Or use: "@id":allbindings[i]["value"] as well?
                                                linkedDataContext[i] = {"@id": ns + i, "@type":"http://www.w3.org/2000/01/rdf-schema#Literal"};
                                                break;
                                            default:
                                                linkedDataContext[i] = "http://www.w3.org/2000/01/rdf-schema#Literal" ;
                                            }
                                    }

                                }
                                var feature = {
                                        "type": "Feature",
                                        "id":"feature_"+bindingindex, // TODO: assign an id, how to do this from a sparql response? How to define this besides generating one?
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
        geojson["@context"] = linkedDataContext;
        return geojson;
}
