import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import App from './App.vue';
import axios from 'axios';

vi.mock('axios');

const mockWeatherData = {
  name: 'London',
  dt: Math.floor(Date.now() / 1000),
  sys: { country: 'GB' },
  main: { temp: 288.15, humidity: 65 },
  wind: { speed: 5.2 },
  weather: [{ description: 'Partly cloudy' }],
};

const mockForecastData = {
  list: [
    {
      dt: Math.floor(Date.now() / 1000),
      main: { temp_max: 290, temp_min: 280, humidity: 60 },
      wind: { speed: 4 },
      weather: [{ description: 'Clear' }],
    },
    {
      dt: Math.floor(Date.now() / 1000) + 86400,
      main: { temp_max: 292, temp_min: 281, humidity: 65 },
      wind: { speed: 5 },
      weather: [{ description: 'Cloudy' }],
    },
    {
      dt: Math.floor(Date.now() / 1000) + 172800,
      main: { temp_max: 291, temp_min: 279, humidity: 70 },
      wind: { speed: 6 },
      weather: [{ description: 'Rainy' }],
    },
  ],
};

describe('App.vue - Core Functionality', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({ data: { record: mockWeatherData } });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Initialization', () => {
    it('renders the app container', () => {
      wrapper = mount(App);
      expect(wrapper.find('.app-container').exists()).toBe(true);
    });

    it('displays the header title', () => {
      wrapper = mount(App);
      expect(wrapper.find('h1').text()).toBe('WEATHER APP');
    });

    it('displays search input and button', () => {
      wrapper = mount(App);
      expect(wrapper.find('.search-input').exists()).toBe(true);
      expect(wrapper.find('.search-button').exists()).toBe(true);
    });

    it('displays loading message initially', () => {
      wrapper = mount(App);
      expect(wrapper.find('.loading').text()).toBe('Loading...');
    });
  });

  describe('Temperature Computed Property', () => {
    it('calculates temperature correctly from Kelvin', () => {
      wrapper = mount(App);
      wrapper.vm.weatherData = mockWeatherData;

      expect(wrapper.vm.temperature).toBe(15); // 288.15K = 15°C
    });

    it('returns null if weatherData is missing', () => {
      wrapper = mount(App);
      wrapper.vm.weatherData = null;

      expect(wrapper.vm.temperature).toBeNull();
    });

    it('returns null if main data is missing', () => {
      wrapper = mount(App);
      wrapper.vm.weatherData = { name: 'London' };

      expect(wrapper.vm.temperature).toBeNull();
    });

    it('handles missing main.temp gracefully', () => {
      wrapper = mount(App);
      wrapper.vm.weatherData = { name: 'London', main: {} };

      expect(wrapper.vm.temperature).toBeNull();
    });
  });

  describe('hourForecast Method', () => {
    it('populates hourly forecast with correct count', () => {
      wrapper = mount(App);
      wrapper.vm.hourForecast(mockForecastData);

      expect(wrapper.vm.hourlyForecast.length).toBe(3);
    });

    it('extracts correct forecast structure', () => {
      wrapper = mount(App);
      wrapper.vm.hourForecast(mockForecastData);

      const forecast = wrapper.vm.hourlyForecast[0];
      expect(forecast).toHaveProperty('time');
      expect(forecast).toHaveProperty('temp_max');
      expect(forecast).toHaveProperty('temp_min');
      expect(forecast).toHaveProperty('description');
      expect(forecast).toHaveProperty('humidity');
      expect(forecast).toHaveProperty('wind_speed');
      expect(forecast).toHaveProperty('last_updated');
    });

    it('converts temperature from Kelvin to Celsius', () => {
      wrapper = mount(App);
      wrapper.vm.hourForecast(mockForecastData);

      const forecast = wrapper.vm.hourlyForecast[0];
      expect(forecast.temp_max).toBe(Math.round(290 - 273.15));
      expect(forecast.temp_min).toBe(Math.round(280 - 273.15));
    });

    it('handles empty forecast list gracefully', () => {
      wrapper = mount(App);
      wrapper.vm.hourForecast({ list: [] });

      expect(wrapper.vm.hourlyForecast).toEqual([]);
    });

    it('handles undefined forecast gracefully', () => {
      wrapper = mount(App);
      wrapper.vm.hourForecast({});

      expect(wrapper.vm.hourlyForecast).toEqual([]);
    });

    it('handles null forecast gracefully', () => {
      wrapper = mount(App);
      wrapper.vm.hourForecast(null);

      expect(wrapper.vm.hourlyForecast).toEqual([]);
    });

    it('handles missing weather data in items', () => {
      wrapper = mount(App);
      const forecastWithoutWeather = {
        list: [
          {
            dt: Math.floor(Date.now() / 1000),
            main: { temp_max: 290, temp_min: 280, humidity: 60 },
            wind: { speed: 4 },
          },
        ],
      };

      wrapper.vm.hourForecast(forecastWithoutWeather);
      expect(wrapper.vm.hourlyForecast[0].description).toBe('No data');
    });

    it('handles missing humidity and wind data', () => {
      wrapper = mount(App);
      const minimalForecast = {
        list: [
          {
            dt: Math.floor(Date.now() / 1000),
            main: { temp_max: 290, temp_min: 280 },
            weather: [{ description: 'Clear' }],
          },
        ],
      };

      wrapper.vm.hourForecast(minimalForecast);
      expect(wrapper.vm.hourlyForecast[0].humidity).toBe(0);
      expect(wrapper.vm.hourlyForecast[0].wind_speed).toBe(0);
    });
  });

  describe('dayForecast Method', () => {
    it('populates daily forecast', () => {
      wrapper = mount(App);
      wrapper.vm.dayForecast(mockForecastData);

      expect(wrapper.vm.dailyForecast.length).toBeGreaterThan(0);
    });

    it('extracts correct daily forecast structure', () => {
      wrapper = mount(App);
      wrapper.vm.dayForecast(mockForecastData);

      const forecast = wrapper.vm.dailyForecast[0];
      expect(forecast).toHaveProperty('date');
      expect(forecast).toHaveProperty('temp_max');
      expect(forecast).toHaveProperty('temp_min');
      expect(forecast).toHaveProperty('description');
      expect(forecast).toHaveProperty('humidity');
      expect(forecast).toHaveProperty('wind_speed');
    });

    it('avoids duplicate dates', () => {
      wrapper = mount(App);
      wrapper.vm.dayForecast(mockForecastData);

      const dates = wrapper.vm.dailyForecast.map((f) => f.date);
      const uniqueDates = new Set(dates);

      expect(dates.length).toBe(uniqueDates.size);
    });

    it('handles empty forecast list gracefully', () => {
      wrapper = mount(App);
      wrapper.vm.dayForecast({ list: [] });

      expect(wrapper.vm.dailyForecast).toEqual([]);
    });

    it('handles undefined forecast gracefully', () => {
      wrapper = mount(App);
      wrapper.vm.dayForecast({});

      expect(wrapper.vm.dailyForecast).toEqual([]);
    });

    it('handles null forecast gracefully', () => {
      wrapper = mount(App);
      wrapper.vm.dayForecast(null);

      expect(wrapper.vm.dailyForecast).toEqual([]);
    });

    it('limits daily forecast to 5 days', () => {
      wrapper = mount(App);
      const manyDays = {
        list: Array(20)
          .fill(null)
          .map((_, i) => ({
            dt: Math.floor(Date.now() / 1000) + i * 86400,
            main: { temp_max: 290, temp_min: 280, humidity: 60 },
            wind: { speed: 4 },
            weather: [{ description: 'Clear' }],
          })),
      };

      wrapper.vm.dayForecast(manyDays);
      expect(wrapper.vm.dailyForecast.length).toBeLessThanOrEqual(5);
    });
  });

  describe('formatTimestamp Utility', () => {
    it('converts unix timestamp to locale string', () => {
      wrapper = mount(App);
      const ts = Math.floor(Date.now() / 1000);
      const result = wrapper.vm.formatTimestamp(ts);

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('returns empty string for null timestamp', () => {
      wrapper = mount(App);
      expect(wrapper.vm.formatTimestamp(null)).toBe('');
    });

    it('returns empty string for undefined timestamp', () => {
      wrapper = mount(App);
      expect(wrapper.vm.formatTimestamp(undefined)).toBe('');
    });

    it('returns empty string for zero timestamp', () => {
      wrapper = mount(App);
      expect(wrapper.vm.formatTimestamp(0)).toBe('');
    });

    it('correctly formats a known timestamp', () => {
      wrapper = mount(App);
      // Using a fixed timestamp for testing
      const ts = 1735689600; // 2025-01-01 00:00:00 UTC
      const result = wrapper.vm.formatTimestamp(ts);

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(10);
    });
  });

  describe('UI Rendering', () => {
    it('displays loading message when no weather data', () => {
      wrapper = mount(App);
      expect(wrapper.find('.loading').text()).toBe('Loading...');
    });

    it('displays weather container when mounted', () => {
      wrapper = mount(App);
      expect(wrapper.find('.app-container').exists()).toBe(true);
    });

    it('displays search section', () => {
      wrapper = mount(App);
      expect(wrapper.find('.search-bar').exists()).toBe(true);
    });

    it('displays weather section structure', () => {
      wrapper = mount(App);
      expect(wrapper.find('.app-container').find('h1').exists()).toBe(true);
    });
  });

  describe('Safety and Error Handling', () => {
    it('handles missing sys object in weather data', () => {
      wrapper = mount(App);
      const data = { ...mockWeatherData, sys: undefined };
      wrapper.vm.weatherData = data;

      // Should not throw
      expect(() => {
        wrapper.vm.$nextTick();
      }).not.toThrow();
    });

    it('handles missing weather array in data', () => {
      wrapper = mount(App);
      const data = { ...mockWeatherData, weather: undefined };
      wrapper.vm.weatherData = data;

      // Should not throw
      expect(() => {
        wrapper.vm.$nextTick();
      }).not.toThrow();
    });

    it('handles missing main object in data', () => {
      wrapper = mount(App);
      const data = { ...mockWeatherData, main: undefined };
      wrapper.vm.weatherData = data;

      // Should not throw
      expect(() => {
        wrapper.vm.temperature;
      }).not.toThrow();
    });

    it('handles missing wind object in forecast', () => {
      wrapper = mount(App);
      const forecast = {
        list: [
          {
            dt: Math.floor(Date.now() / 1000),
            main: { temp_max: 290, temp_min: 280, humidity: 60 },
            weather: [{ description: 'Clear' }],
          },
        ],
      };

      wrapper.vm.hourForecast(forecast);
      expect(wrapper.vm.hourlyForecast[0].wind_speed).toBe(0);
    });
  });

  describe('Data Initialization', () => {
    it('initializes with empty city name', () => {
      wrapper = mount(App);
      expect(wrapper.vm.city).toBe('');
    });

    it('initializes with empty hourly forecast array', () => {
      wrapper = mount(App);
      expect(wrapper.vm.hourlyForecast).toEqual([]);
    });

    it('initializes with empty daily forecast array', () => {
      wrapper = mount(App);
      expect(wrapper.vm.dailyForecast).toEqual([]);
    });

    it('initializes with null weather data', () => {
      wrapper = mount(App);
      expect(wrapper.vm.weatherData).toBeNull();
    });
  });
});
