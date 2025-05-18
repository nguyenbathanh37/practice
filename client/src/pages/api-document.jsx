import React, { useEffect } from 'react';
import { RedocStandalone } from 'redoc';

const ApiDocs = () => {
  return (
    <RedocStandalone
      specUrl="/openapi.yaml"
      options={{
        nativeScrollbars: true,
        theme: { colors: { primary: { main: '#00bcd4' } } },
      }}
    />
  );
};

export default ApiDocs;
