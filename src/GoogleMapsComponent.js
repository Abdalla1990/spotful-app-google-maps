import React from 'react';
import {withScriptjs,withGoogleMap, GoogleMap, Marker } from "react-google-maps"
import {GoogleApiWrapper} from 'react-google-maps'
const GoogleMapsComponent = withGoogleMap((props) =>{

    return (
        <GoogleMap {...props}>
          {props.geometry && <Marker position={{ lat: props.geometry.lat, lng: props.geometry.lng }} />}
        </GoogleMap>
    )
  })

  export default GoogleMapsComponent ;

