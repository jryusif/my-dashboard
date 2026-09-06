import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let lat = searchParams.get('lat');
    let lon = searchParams.get('lon');
    let cityName = searchParams.get('city');

    // If coordinates are not provided, attempt IP geolocation or default
    if (!lat || !lon) {
      let clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
      if (clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
      }

      // Check if IP is public
      const isPrivate = !clientIp || clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.');
      
      if (!isPrivate) {
        try {
          const ipRes = await fetch(`https://ipwho.is/${clientIp}`, { signal: AbortSignal.timeout(3000) });
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            if (ipData && ipData.success) {
              lat = ipData.latitude;
              lon = ipData.longitude;
              cityName = cityName || ipData.city;
            }
          }
        } catch (e) {
          // ignore ip lookup error and proceed to fallback
        }
      }

      // Fallback if still not determined
      if (!lat || !lon) {
        // Fallback default coordinates (e.g. Cairo 30.0444, 31.2357 or Warsaw 52.2297, 21.0122)
        lat = '30.0444';
        lon = '31.2357';
        cityName = cityName || 'Cairo';
      }
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // 1. Fetch live weather & timezone from Open-Meteo
    let temp = 16;
    let weatherCode = 0;
    let utcOffsetSec = 7200;
    let timezoneName = 'auto';

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day&timezone=auto`;
      const weatherRes = await fetch(weatherUrl, { signal: AbortSignal.timeout(4000) });
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        if (weatherData && weatherData.current) {
          temp = Math.round(weatherData.current.temperature_2m);
          weatherCode = weatherData.current.weather_code;
          utcOffsetSec = weatherData.utc_offset_seconds || 0;
          timezoneName = weatherData.timezone || 'UTC';
        }
      }
    } catch (err) {
      console.warn('Could not fetch Open-Meteo weather:', err.message);
    }

    // 2. Reverse Geocode for City name if not provided
    if (!cityName || cityName === 'undefined') {
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`;
        const geoRes = await fetch(geoUrl, {
          headers: { 'User-Agent': 'PersonalDashboard/1.0' },
          signal: AbortSignal.timeout(3500)
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.address) {
            cityName = geoData.address.city ||
                       geoData.address.town ||
                       geoData.address.municipality ||
                       geoData.address.village ||
                       geoData.address.county ||
                       geoData.address.state ||
                       geoData.name ||
                       'My Location';
          }
        }
      } catch (err) {
        console.warn('Nominatim reverse geocode error:', err.message);
        cityName = 'My Location';
      }
    }

    // Calculate GMT Offset string (e.g. GMT+2, GMT-4)
    const hoursOffset = Math.round(utcOffsetSec / 3600);
    const gmtOffsetStr = `GMT${hoursOffset >= 0 ? '+' : ''}${hoursOffset}`;

    // Format temperature with + or -
    const tempFormatted = `${temp >= 0 ? '+' : ''}${temp}°`;

    return NextResponse.json({
      success: true,
      city: cityName || 'My Location',
      latitude,
      longitude,
      temperature: temp,
      temperatureFormatted: tempFormatted,
      weatherCode,
      timezone: timezoneName,
      gmtOffset: gmtOffsetStr,
      utcOffsetSeconds: utcOffsetSec
    });
  } catch (error) {
    console.error('Weather location API error:', error);
    return NextResponse.json({
      success: false,
      city: 'Warsaw',
      latitude: 52.2297,
      longitude: 21.0122,
      temperature: 16,
      temperatureFormatted: '+16°',
      gmtOffset: 'GMT+2',
      error: error.message
    }, { status: 500 });
  }
}
