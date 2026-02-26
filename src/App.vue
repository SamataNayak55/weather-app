<!-- App.vue -->
<template>
  <div class="app-container">
    <div class="header">
      <h1>WEATHER APP</h1>
      <div class="search-bar">
        <input
          type="text"
          v-model="city"
          placeholder="Enter city name"
          class="search-input"
        />
        <button @click="searchByCity"
                class="search-button">Search</button>
      </div>
    </div>

    <main class="main-section">
      <div v-if="weatherData" class="weather">
        <h2>{{ weatherData.name }}, 
            {{ weatherData.sys?.country || 'Unknown' }}</h2>
        <div class="temp-box">
          
          <p class="temperature">{{ temperature }} °C</p>
          <div class="meta">
            <span class="clouds">Humidity: {{ weatherData.main?.humidity || 0 }}%</span>
            <span class="clouds">Wind: {{ weatherData.wind?.speed || 0 }} m/s</span>
            <span class="clouds">Updated: {{ weatherData.last_updated || formatTimestamp(weatherData.dt) }}</span>
          </div>
        </div>
        <span class="clouds">{{ weatherData.weather?.[0]?.description || 'No data' }}</span>
      </div>
      <div v-else class="loading">Loading...</div>
      <div class="divider"></div>

      <div class="forecast">
        <div class="cast-header">Upcoming forecast</div>
        <div class="forecast-list">
          <div
            class="next"
            v-for="(forecast, index) in hourlyForecast"
            :key="index"
          >
            <div>
              <p class="time">{{ forecast.time }}</p>
              <p class="temp-max">{{ forecast.temp_max }} °C</p>
              <p class="temp-min">{{ forecast.temp_min }} °C</p>
            </div>
            <p class="desc">{{ forecast.description }}</p>
            <p class="desc">Humidity: {{ forecast.humidity }}% </p>
            <p class="desc">• Wind: {{ forecast.wind_speed }} m/s  </p>
            <p class="desc">• Pressure: {{ forecast.pressure }} hPa</p>
          </div>
        </div>
      </div>
    </main>

    <div v-if="dailyForecast.length" class="forecast">
      <div class="cast-header">Next 5 days forecast</div>
      <div class="forecast-list">
        <div
          class="day"
          v-for="(forecast, index) in dailyForecast"
          :key="index"
        >
          <p class="date">{{ forecast.date }}</p>
          <p class="temp-max">{{ forecast.temp_max }} °C</p>
          <p class="temp-min">{{ forecast.temp_min }} °C</p>
          <p class="desc">{{ forecast.description }}</p>
          <p class="desc">Humidity: {{ forecast.humidity }}%</p>
          <p class="desc"> Wind: {{ forecast.wind_speed }} m/s</p>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

const apikey = "feff206daa60b539abe8fae8f2ab7f29";

export default {
  name: "App",
  data() {
    return {
      city: "",
      weatherData: null,
      hourlyForecast: [],
      dailyForecast: [],
    };
  },
  computed: {
    temperature() {
      return this.weatherData && this.weatherData.main && this.weatherData.main.temp
        ? Math.round(this.weatherData.main.temp - 273.15)
        : null;
    },
  },
  mounted() {
    this.fetchCurrentLocationWeather();
  },
  methods: {
    async fetchCurrentLocationWeather() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const url = `http://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apikey}`;
          await this.fetchWeatherData(url);
        });
      }
    },
    async fetchWeatherData(url) {
      try {
        const response = await axios.get(url);
        this.weatherData = response.data;
        // add last-updated string for display
        this.weatherData.last_updated = this.formatTimestamp(this.weatherData.dt);
        // Fetch forecast data
        await this.fetchForecast(this.weatherData.name);
      } catch (error) {
        console.error("Error fetching weather data:", error);
      }
    },
    async fetchForecast(city) {
      const urlcast = `http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apikey}`;
      try {
        const response = await axios.get(urlcast);
        const forecast = response.data;
        this.hourForecast(forecast);
        this.dayForecast(forecast);
      } catch (error) {
        console.error("Error fetching forecast data:", error);
      }
    },
    async searchByCity() {
      if (!this.city) return;
      try {
        const urlsearch = `http://api.openweathermap.org/data/2.5/weather?q=${this.city}&appid=${apikey}`;
        const response = await axios.get(urlsearch);
        this.weatherData = response.data;
        // Fetch forecast data
        await this.fetchForecast(this.weatherData.name);
      } catch (error) {
        console.error("Error fetching weather data:", error);
        alert("City not found. Please try again.");
      }
      this.city = "";
    },
    hourForecast(forecast) {
      this.hourlyForecast = [];
      if (!forecast || !forecast.list || forecast.list.length === 0) return;
      for (let i = 0; i < Math.min(5, forecast.list.length); i++) {
        const item = forecast.list[i];
        const date = new Date((item.dt || 0) * 1000);
        this.hourlyForecast.push({
          time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }),
          temp_max: Math.round((item.main?.temp_max || 0) - 273.15),
          temp_min: Math.round((item.main?.temp_min || 0) - 273.15),
          description: item.weather?.[0]?.description || 'No data',
          humidity: item.main?.humidity || 0,
          wind_speed: item.wind?.speed ?? (item.wind_speed || 0),
          last_updated: this.formatTimestamp(item.dt),
        });
      }
    },
    dayForecast(forecast) {
      this.dailyForecast = [];
      if (!forecast || !forecast.list || forecast.list.length === 0) return;
      const seen = new Set();
      for (let i = 1; i < forecast.list.length && this.dailyForecast.length < 5; i++) {
        const item = forecast.list[i];
        const date = new Date((item.dt || 0) * 1000);
        const day = date.toDateString();
        if (!seen.has(day)) {
          seen.add(day);
          this.dailyForecast.push({
            date: day,
            temp_max: Math.round((item.main?.temp_max || 0) - 273.15),
            temp_min: Math.round((item.main?.temp_min || 0) - 273.15),
            description: item.weather?.[0]?.description || 'No data',
            humidity: item.main?.humidity || 0,
            wind_speed: item.wind?.speed ?? (item.wind_speed || 0),
            last_updated: this.formatTimestamp(item.dt),
          });
        }
      }
    },
    formatTimestamp(ts) {
      if (!ts) return '';
      return new Date(ts * 1000).toLocaleString();
    },
  },
};
</script>

