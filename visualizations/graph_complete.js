// graph_complete.js
// Simplified chart creation logic with dimension flexibility

// Import chart factory
import { createVisualization } from './chart_factory.js';
// Import size scaling functions
import { applyScaling, defaultScaling, sigmoidScaling } from './scaling/size_scaling.js';

// Main application logic
let generatedData = null;
let currentChart = null;

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
  loadGeneratedData();
  setupEventListeners();
});

function loadGeneratedData() {
  hideError();
  
  try {
    const dataString = sessionStorage.getItem('generatedData');
    if (!dataString) {
      showError('No data found. Please generate data first.');
      document.getElementById('data-info').innerHTML = 
        '<strong>❌ No data found.</strong> <a href="index.html">Go back to generate data</a>';
      return;
    }
    
    generatedData = JSON.parse(dataString);
    console.log('📊 Loaded data:', generatedData);
    
    // Show data info
    const dataInfo = document.getElementById('data-info');
    const pointCount = generatedData.data_value ? generatedData.data_value.length : 0;
    const dimensions = generatedData.basic_data ? generatedData.basic_data.dim : 0;
    const axisNames = generatedData.basic_data ? 
      generatedData.basic_data.axes.map(a => a.name).join(', ') : 'Unknown';
    
    dataInfo.innerHTML = `
      <strong>✅ Data loaded successfully!</strong><br>
      Points: ${pointCount} | Dimensions: ${dimensions} | Available axes: ${axisNames}
    `;
    
    // Enable form
    document.getElementById('create-chart-btn').disabled = false;
    
  } catch (error) {
    console.error('❌ Failed to load data:', error);
    showError('Failed to load data: ' + error.message);
    document.getElementById('data-info').innerHTML = 
      '<strong>❌ Error loading data.</strong> <a href="index.html">Go back to generate data</a>';
  }
}

function setupEventListeners() {
  document.getElementById('create-chart-btn').addEventListener('click', createChart);
  
  // Allow Enter key to create chart
  ['dimension', 'chart-type', 'x-axis', 'y-axis', 'color-axis', 'size-axis', 'size-scaling-type', 'size-scaling-k', 'x-range-min', 'x-range-max', 'y-range-min', 'y-range-max', 'chart-title'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createChart();
      });
    }
  });
}

function createChart() {
  if (!generatedData) {
    showError('No data available');
    return;
  }
  
  // Get form values
  const dimension = document.getElementById('dimension').value;
  const chartType = document.getElementById('chart-type').value.trim();
  const xAxisName = document.getElementById('x-axis').value.trim();
  const yAxisName = document.getElementById('y-axis').value.trim();
  const colorAxisName = document.getElementById('color-axis').value.trim();
  const sizeAxisName = document.getElementById('size-axis').value.trim();
  const sizeScalingType = document.getElementById('size-scaling-type').value.trim();
  const sizeScalingK = document.getElementById('size-scaling-k').value.trim();
  const xRangeMin = document.getElementById('x-range-min').value.trim();
  const xRangeMax = document.getElementById('x-range-max').value.trim();
  const yRangeMin = document.getElementById('y-range-min').value.trim();
  const yRangeMax = document.getElementById('y-range-max').value.trim();
  const chartTitle = document.getElementById('chart-title').value.trim() || 'Chart';
  
  // Basic validation
  if (!chartType) {
    showError('Please enter a chart type');
    return;
  }
  
  if (!xAxisName) {
    showError('Please enter X axis name');
    return;
  }
  
  // Check if this chart type needs Y axis
  const needsYAxis = chartType === 'scatter' || 
                     chartType.includes('scatter') || 
                     chartType === 'bar' || 
                     chartType.includes('bar');
  
  // For charts that need Y axis, require it for 2D+
  if (parseInt(dimension) >= 2 && needsYAxis && !yAxisName) {
    showError(`Please enter Y axis name for ${chartType} charts`);
    return;
  }
  
  // Validate size scaling configuration
  let scalingConfig = { type: 'default', params: {} };
  
  if (sizeScalingType) {
    // Validate scaling type (case sensitive)
    if (sizeScalingType !== 'default' && sizeScalingType !== 'sigmoid') {
      showError('Size Scaling Type must be exactly "default" or "sigmoid"');
      return;
    }
    
    if (sizeScalingType === 'sigmoid') {
      // Require K value for sigmoid
      if (!sizeScalingK) {
        showError('K Value is required when using sigmoid scaling');
        return;
      }
      
      // Validate K value is a number between 0.1 and 10.0
      const kValue = parseFloat(sizeScalingK);
      if (isNaN(kValue) || kValue < 0.1 || kValue > 10.0) {
        showError('K Value must be a number between 0.1 and 10.0');
        return;
      }
      
      scalingConfig = {
        type: 'sigmoid',
        params: { k: kValue }
      };
    } else {
      // For default scaling, ignore K value completely
      scalingConfig = {
        type: 'default',
        params: {}
      };
    }
  }
  
  // Validate windowing ranges
  const windowRanges = {};
  
  // Validate X axis range if provided
  if (xRangeMin || xRangeMax) {
    if (!xRangeMin || !xRangeMax) {
      showError('Both X Axis Range Min and Max must be provided if using X axis windowing');
      return;
    }
    const xMin = parseFloat(xRangeMin);
    const xMax = parseFloat(xRangeMax);
    if (isNaN(xMin) || isNaN(xMax) || xMin >= xMax) {
      showError('X Axis Range Min must be less than Max and both must be valid numbers');
      return;
    }
    windowRanges[xAxisName] = { min: xMin, max: xMax };
  }
  
  // Validate Y axis range if provided and Y axis is used
  if (yRangeMin || yRangeMax) {
    if (!needsYAxis) {
      // Ignore Y range for charts that don't use Y axis
      console.log('Ignoring Y axis range for chart type that does not use Y axis');
    } else {
      if (!yRangeMin || !yRangeMax) {
        showError('Both Y Axis Range Min and Max must be provided if using Y axis windowing');
        return;
      }
      const yMin = parseFloat(yRangeMin);
      const yMax = parseFloat(yRangeMax);
      if (isNaN(yMin) || isNaN(yMax) || yMin >= yMax) {
        showError('Y Axis Range Min must be less than Max and both must be valid numbers');
        return;
      }
      windowRanges[yAxisName] = { min: yMin, max: yMax };
    }
  }
  
  try {
    // Helper function to create axis configuration
    function createAxisConfig(axisName) {
      if (axisName === 'value') {
        return {
          name: axisName,
          type: 'output',
          index: 0
        };
      } else {
        const axisIndex = findAxisIndex(axisName);
        if (axisIndex === -1) {
          return null; // Invalid axis
        }
        return {
          name: axisName,
          type: 'input',
          index: axisIndex
        };
      }
    }
    
    // Build axes array based on chart type and inputs
    const axes = [];
    
    // Always add X axis
    const xAxis = createAxisConfig(xAxisName);
    if (!xAxis) {
      showError(`X axis "${xAxisName}" not found in data`);
      return;
    }
    axes.push(xAxis);
    
    // Add Y axis only for charts that need it
    const needsYAxis = chartType === 'scatter' || 
                       chartType.includes('scatter') || 
                       chartType === 'bar' || 
                       chartType.includes('bar');
    
    if (needsYAxis && yAxisName) {
      const yAxis = createAxisConfig(yAxisName);
      if (!yAxis) {
        showError(`Y axis "${yAxisName}" not found in data`);
        return;
      }
      axes.push(yAxis);
    }
    
    // Add 3rd and 4th axes based on chart type
    if (parseInt(dimension) >= 2) {
      // Determine which axes are needed based on chart type
      const needsColor = chartType.includes('color') || chartType === 'size_color' || chartType === 'color';
      const needsSize = chartType.includes('size') || chartType === 'size_color' || chartType === 'size';
      
      // For charts that need color
      if (needsColor && colorAxisName) {
        const colorAxis = createAxisConfig(colorAxisName);
        if (!colorAxis) {
          showError(`Color axis "${colorAxisName}" not found in data`);
          return;
        }
        axes.push(colorAxis);
      }
      
      // For charts that need size
      if (needsSize && sizeAxisName) {
        const sizeAxis = createAxisConfig(sizeAxisName);
        if (!sizeAxis) {
          showError(`Size axis "${sizeAxisName}" not found in data`);
          return;
        }
        axes.push(sizeAxis);
      }
    }
    
    console.log('📊 Built axes configuration:', axes);
    console.log('📏 Size scaling configuration:', scalingConfig);
    
    // Create dataset configuration
    const dataset = {
      name: chartTitle,
      dimension: parseInt(dimension),
      axes: axes,
      dataType: `${dimension}D`
    };
    
    // Create visualization type
    const vizType = {
      name: chartType,
      type: chartType
    };
    
    // Prepare data for visualization (simplified version)
    const preparedData = prepareDataForChart(generatedData.data_value, axes);
    
    if (preparedData.length === 0) {
      showError('No valid data points found for the specified axes');
      return;
    }
    
    // Apply windowing if ranges are provided
    let finalData = preparedData;
    if (Object.keys(windowRanges).length > 0) {
      finalData = applyWindowFiltering(preparedData, windowRanges);
      console.log(`🪟 Applied windowing: ${preparedData.length} → ${finalData.length} points`);
      
      if (finalData.length === 0) {
        showError('No data points remain after applying window ranges. Please adjust your ranges.');
        return;
      }
    }
    
    console.log('📋 Final data:', finalData.slice(0, 3), '... (showing first 3 points)');
    
    // Destroy existing chart
    if (currentChart) {
      currentChart.destroy();
      currentChart = null;
    }
    
    // Show chart container
    const chartContainer = document.getElementById('chart-container');
    chartContainer.style.display = 'block';
    
    // Get canvas element
    const canvas = document.getElementById('chart-canvas');
    canvas.style.width = '100%';
    canvas.style.height = '400px';
    
    // Create chart using chart factory
    const chartConfig = createVisualization(
      dataset,
      vizType,
      finalData, // Use windowed data
      scalingConfig, // Pass size scaling configuration
      {}, // colorScalingConfig
      {}  // vizOptions
    );
    
    // Create Chart.js instance
    currentChart = new Chart(canvas, chartConfig);
    
    console.log('✅ Chart created successfully');
    
  } catch (error) {
    console.error('❌ Chart creation failed:', error);
    showError('Chart creation failed: ' + error.message);
  }
}

function findAxisIndex(axisName) {
  if (!generatedData.basic_data || !generatedData.basic_data.axes) {
    return -1;
  }
  
  const axis = generatedData.basic_data.axes.find(a => a.name === axisName);
  return axis ? generatedData.basic_data.axes.indexOf(axis) : -1;
}

// Simplified data preparation for chart factory
function prepareDataForChart(dataValue, axes) {
  const preparedData = [];
  
  dataValue.forEach((point, index) => {
    try {
      const coords = point[0];
      const value = point[1];
      
      const dataPoint = {
        _originalIndex: index,
        _coords: coords,
        _value: value
      };
      
      // Extract data for each axis
      let isValidPoint = true;
      
      axes.forEach(axis => {
        let extractedValue = null;
        
        if (axis.type === 'input') {
          if (coords && Array.isArray(coords) && coords.length > axis.index) {
            extractedValue = coords[axis.index];
          } else {
            isValidPoint = false;
          }
        } else if (axis.type === 'output') {
          extractedValue = value;
        }
        
        if (extractedValue !== null && extractedValue !== undefined) {
          dataPoint[axis.name] = extractedValue;
        } else {
          isValidPoint = false;
        }
      });
      
      if (isValidPoint) {
        preparedData.push(dataPoint);
      }
      
    } catch (error) {
      console.warn(`Error processing point ${index}:`, error);
    }
  });
  
  return preparedData;
}

// Apply window filtering to data (adapted from previous project)
function applyWindowFiltering(data, windowRanges) {
  console.log(`🪟 Applying window filtering:`, windowRanges);
  
  const filteredData = data.filter(dataPoint => {
    for (const axisName in windowRanges) {
      const range = windowRanges[axisName];
      const value = dataPoint[axisName];

      if (value !== undefined && value !== null && !isNaN(value)) {
        if (value < range.min || value > range.max) {
          return false; // Filter out point outside range
        }
      }
    }
    return true; // Keep point within all ranges
  });
  
  // Log filtering results
  Object.entries(windowRanges).forEach(([axisName, range]) => {
    const originalValues = data.map(d => d[axisName]).filter(v => v !== undefined && v !== null && !isNaN(v));
    const filteredValues = filteredData.map(d => d[axisName]).filter(v => v !== undefined && v !== null && !isNaN(v));
    console.log(`🪟 Window ${axisName}: [${range.min}, ${range.max}] → ${originalValues.length} → ${filteredValues.length} points`);
  });
  
  return filteredData;
}

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

function hideError() {
  const errorDiv = document.getElementById('error-message');
  errorDiv.style.display = 'none';
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (currentChart) {
    currentChart.destroy();
  }
});