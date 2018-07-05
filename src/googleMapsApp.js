import React, { Component } from 'react';
import {SpotfulAppCommunicationApi} from './spotful-app-communication-api.min.js';
import './css/styles.css';
import {withScriptjs,withGoogleMap, GoogleMap, Marker } from "react-google-maps";
import GoogleMapsComponent from './GoogleMapsComponent';
import axios from 'axios';
import _ from 'lodash';
import jsonp from 'jsonp';
class googleMapsApp extends Component {

    constructor(props){

        super(props);
        this.state={
          map:this.renderMap(),
          search:undefined,
          // geometry:{
          //   lat: 45.5016889, lng: -73.567256
          // },
          zoom:15,
          googleMapUrl : 'https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places',
          defultCenter : {lat: 45.5016889, lng: -73.567256}
        }
        // prevent calling the api on every geo update , wait for awhile
        this.getGeometry = _.debounce(this.getGeometry,1000);
       
    }


    updateEventListner = (payload)=>{
      
      if(payload.value.zoom !== undefined && this.state.zoom !== payload.value.zoom){
        
        this.setState(()=>({
          zoom : payload.value.zoom
        }))

        // update the map
        this.renderMap();
      }

      if(payload.value.search !== undefined && this.state.search !== payload.value.search){
        
        this.setState(()=>({
          search : payload.value.search
        }))

        this.getGeometry(this.state.search);
      } 
    }

    

    getGeometry = (search)=>{
      
      if(search !== undefined){
        var request = {
          query: search,
          fields: ['geometry']
        }
        
        var service = new google.maps.places.PlacesService(this.mapRef.state.map);
        
        let self = this;
        
        service.findPlaceFromQuery(request, (places, status) => {
          
          if(places !== null){
            let lat = places[0].geometry.location.lat();
            let lng = places[0].geometry.location.lng();
            
            this.setState(()=>({geometry:{lat,lng},defultCenter:{lat,lng}}));
            this.renderMap();
          }
        });
       
      }
    }


    componentDidMount = () =>{
      if(SpotfulAppCommunicationApi !== undefined){
          SpotfulAppCommunicationApi.ready();
          SpotfulAppCommunicationApi.addEventListener('update',this.updateEventListner);
          SpotfulAppCommunicationApi.addEventListener('show',(payload)=>{
            console.log('show');
            document.body.style.display = "block";
          });
          SpotfulAppCommunicationApi.addEventListener('hide',(payload)=>{
            console.log('hide');
            document.body.style.display = "none";
          });
      }
    }

    
    
      
    
  
    renderMap = ()=>{

      //empty the map view in case it previously existed
      this.timeout = setTimeout(() => this.setState({map:null}));

      // render the new map view 
      // we set a new map to the state , which gets called in the render function
      this.timeout = setTimeout(() => this.setState({
        map: 
        <section>
          <GoogleMapsComponent
            defaultZoom={this.state.zoom || 15}
            isMarkerShown = {this.state.search?true:false}
            googleMapURL={this.state.googleMapUrl}
            loadingElement={<div style={{ height: `100%`,width: `100%` }} />}
            containerElement={<div style={{ height: `100%`,width: `100%` }} />}
            mapElement={<div style={{ height: `100%`,width: `100%` }} />}
            geometry={this.state.geometry}
            defaultCenter={this.state.defultCenter}
            ref = {ref => this.mapRef = ref}
            
          />
        </section>
      }), 300)
    }


    componentWillUnmount () {

      clearTimeout(this.timeout);

    }
  

    render () {
     
        return (
          <div>{this.state.map}</div>
        )
      
    }
}

export default googleMapsApp;




