
// data_processor.js

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

// windowRanges와 showError를 파라미터로 받도록 수정
export function makefinaldata(preparedData, windowRanges = {}, showError = null) {
  var finalData = preparedData;
  if (Object.keys(windowRanges).length > 0) {
    finalData = applyWindowFiltering(preparedData, windowRanges);
    console.log(`🪟 Applied windowing: ${preparedData.length} → ${finalData.length} points`);
    
    if (finalData.length === 0) {
      if (showError) {
        showError('No data points remain after applying window ranges. Please adjust your ranges.');
      }
      return [];
    }
  }
  return finalData;
}

// generatedData를 파라미터로 받도록 수정
export function createAxisConfig(axisName, generatedData) {
  if (axisName === 'value') {
    return {
      name: axisName,
      type: 'output',
      index: 0
    };
  } else {
    const axisIndex = findAxisIndex(axisName, generatedData);
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

// generatedData를 파라미터로 받도록 수정
function findAxisIndex(axisName, generatedData) {
  if (!generatedData || !generatedData.basic_data || !generatedData.basic_data.axes) {
    return -1;
  }
  
  const axis = generatedData.basic_data.axes.find(a => a.name === axisName);
  return axis ? generatedData.basic_data.axes.indexOf(axis) : -1;
}

export function prepareDataForChart(dataValue, axes) {
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


// // visualizations/data_processor.js
// // 시각화를 위한 데이터 처리 (필터링, 변환 등)

// /**
//  * Process data for visualization
//  * This is a simplified version since most processing is done in graph_generator
//  */
// export function processDataForVisualization(data, vizType, options = {}) {
//   if (!data || data.length === 0) {
//     return [];
//   }
  
//   let processedData = [...data];
  
//   // Apply any visualization-specific transformations
//   switch (vizType) {
//     case 'category':
//       // Group by category
//       processedData = groupByCategory(processedData);
//       break;
      
//     case 'bar':
//     case 'grouped_bar':
//       // Aggregate data for bar charts
//       processedData = aggregateForBarChart(processedData, options);
//       break;
      
//     // Add more specific processing as needed
//   }
  
//   return processedData;
// }

// // Group data by category
// function groupByCategory(data) {
//   const grouped = {};
  
//   data.forEach(item => {
//     const category = item.String || item[Object.keys(item)[0]];
//     if (!grouped[category]) {
//       grouped[category] = [];
//     }
//     grouped[category].push(item);
//   });
  
//   return Object.entries(grouped).map(([category, items]) => ({
//     category,
//     count: items.length,
//     items
//   }));
// }

// // Aggregate data for bar charts
// function aggregateForBarChart(data, options) {
//   const { groupBy, aggregateBy, aggregateFunction = 'mean' } = options;
  
//   if (!groupBy || !aggregateBy) {
//     return data;
//   }
  
//   const grouped = {};
  
//   data.forEach(item => {
//     const key = item[groupBy];
//     if (!grouped[key]) {
//       grouped[key] = [];
//     }
//     grouped[key].push(item[aggregateBy]);
//   });
  
//   return Object.entries(grouped).map(([key, values]) => ({
//     [groupBy]: key,
//     [aggregateBy]: aggregate(values, aggregateFunction),
//     count: values.length
//   }));
// }

// // Aggregate function
// function aggregate(values, func) {
//   const numbers = values.filter(v => !isNaN(v));
  
//   if (numbers.length === 0) return 0;
  
//   switch (func) {
//     case 'sum':
//       return numbers.reduce((a, b) => a + b, 0);
//     case 'mean':
//       return numbers.reduce((a, b) => a + b, 0) / numbers.length;
//     case 'median':
//       const sorted = numbers.sort((a, b) => a - b);
//       const mid = Math.floor(sorted.length / 2);
//       return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
//     case 'min':
//       return Math.min(...numbers);
//     case 'max':
//       return Math.max(...numbers);
//     default:
//       return numbers[0];
//   }
// }

// // Sort data for better visualization
// export function sortData(data, sortBy, order = 'asc') {
//   if (!sortBy || !data.length) return data;
  
//   return [...data].sort((a, b) => {
//     const aVal = a[sortBy];
//     const bVal = b[sortBy];
    
//     if (typeof aVal === 'string') {
//       return order === 'asc' 
//         ? aVal.localeCompare(bVal)
//         : bVal.localeCompare(aVal);
//     }
    
//     return order === 'asc' ? aVal - bVal : bVal - aVal;
//   });
// }

// // Limit data points for performance
// export function limitDataPoints(data, maxPoints = 1000) {
//   if (data.length <= maxPoints) return data;
  
//   // Simple sampling - take every nth point
//   const step = Math.ceil(data.length / maxPoints);
//   return data.filter((_, index) => index % step === 0);
// }