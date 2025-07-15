import React from "react";
import { LoadScript } from "@react-google-maps/api";

const libraries = ["places"];

const GoogleMapsProvider = ({ children }) => {
  return (
    <LoadScript
      googleMapsApiKey="AIzaSyAqrF-3Wfb2WKnYxtP0lV5M6EiQhG109AQ"
      libraries={libraries}
    >
      {children}
    </LoadScript>
  );
};

export default GoogleMapsProvider;
