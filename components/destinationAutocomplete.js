'use client';

import { useState, useEffect, useRef } from 'react';

const DestinationAutocomplete = ({
  destination,
  setDestination,
  setDestinationLocation,
  placeholder,
}) => {
  const [predictions, setPredictions] = useState([]);
  const serviceRef = useRef(null);
  const placesServiceRef = useRef(null);

  // ✅ Initialize services once (Google is loaded from parent <LoadScript>)
  useEffect(() => {
    if (window.google && !serviceRef.current) {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
    }
  }, []);

  const handleInput = (e) => {
    const input = e.target.value;
    setDestination(input);

    if (!input || !serviceRef.current) return;

    serviceRef.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'iq' },
        language: 'ar',
        //types: ['establishment'], // only schools/places, avoid raw codes
      },
      (preds) => {
        setPredictions(preds || []);
      }
    );
  };

  const handleSelect = (prediction) => {
    let desc = prediction.description;

    if (!desc.includes('العراق')) {
      desc = desc + '، العراق';
    }

    setDestination(desc);
    setPredictions([]);

    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry.location'],
      },
      (place) => {
        if (place?.geometry?.location) {
          setDestinationLocation({
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          });
        }
      }
    );
  };

  return (
    <div style={{ position: 'relative', width: '300px' }}>
      <input
        placeholder={placeholder}
        value={destination}
        onChange={handleInput}
        className="destination-autcomplete-input"
        style={{ width: '100%' }}
      />

      {predictions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '5px',
            zIndex: 99999,
            maxHeight: '200px',
            overflowY: 'auto',
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {predictions.map((p) => (
            <li
              key={p.place_id}
              onClick={() => handleSelect(p)}
              style={{ padding: '8px', cursor: 'pointer' }}
            >
              {p.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DestinationAutocomplete;

