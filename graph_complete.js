// graph_complete.js
// Simplified chart creation logic with dimension flexibility

// Import chart factory
import { createVisualization } from './chart_gen/chart_factory.js';
import { loadGeneratedData } from './chart_gen/data_load.js';
import { createAxisConfig, prepareDataForChart, makefinaldata } from './chart_gen/data_processor.js';
import { validateAllInputs } from './chart_gen/data_validate.js';

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}
function hideError() {
  const errorDiv = document.getElementById('error-message');
  errorDiv.style.display = 'none';
}
//이벤트 리스너 추가
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

/**
 * 폼에서 입력값들을 수집하는 함수
 */
function getFormData() {
  return {
    dimension: document.getElementById('dimension').value,
    chartType: document.getElementById('chart-type').value.trim(),
    xAxisName: document.getElementById('x-axis').value.trim(),
    yAxisName: document.getElementById('y-axis').value.trim(),
    colorAxisName: document.getElementById('color-axis').value.trim(),
    sizeAxisName: document.getElementById('size-axis').value.trim(),
    sizeScalingType: document.getElementById('size-scaling-type').value.trim(),
    sizeScalingK: document.getElementById('size-scaling-k').value.trim(),
    xRangeMin: document.getElementById('x-range-min').value.trim(),
    xRangeMax: document.getElementById('x-range-max').value.trim(),
    yRangeMin: document.getElementById('y-range-min').value.trim(),
    yRangeMax: document.getElementById('y-range-max').value.trim(),
    chartTitle: document.getElementById('chart-title').value.trim() || 'Chart'
  };
}

/**
 * 차트 생성 메인 함수 - 이제 단순히 데이터를 받아서 createVisualization에 전달
 */
function createChart() {
  // 1. 데이터 존재 여부 확인
  if (!generatedData) {
    showError('No data available');
    return;
  }
  
  // 2. 폼 데이터 수집
  const formData = getFormData();
  // 3. 모든 유효성 검사를 한번에 수행
  const validation = validateAllInputs(formData, generatedData, createAxisConfig);
  if (!validation.isValid) {
    showError(validation.error);
    return;
  }
  
  // 4. 검증된 데이터 추출
  const { axes, scalingConfig, windowRanges } = validation.validatedData;
  
  try {
    // 5. 데이터 준비
    const preparedData = prepareDataForChart(generatedData.data_value, axes);

    if (preparedData.length === 0) {
      showError('No valid data points found for the specified axes');
      return;
    }
    
    // 6. 윈도우 필터링 적용
    const finalData = makefinaldata(preparedData, windowRanges, showError);
    
    if (!finalData || finalData.length === 0) {
      showError('No valid data points found after processing');
      return;
    }
        
    // 7. 차트 설정 객체 생성
    const dataset = {
      name: formData.chartTitle,
      dimension: parseInt(formData.dimension),
      axes: axes,
      dataType: `${formData.dimension}D`
    };
    const vizType = {
      name: formData.chartType,
      type: formData.chartType
    };
    
    // 8. 기존 차트 정리
    if (currentChart) {
      currentChart.destroy();
      currentChart = null;
    }
    
    // 9. 차트 컨테이너 표시
    const chartContainer = document.getElementById('chart-container');
    chartContainer.style.display = 'block';
    const canvas = document.getElementById('chart-canvas');
    canvas.style.width = '100%';
    canvas.style.height = '400px';
    
    // 10. 차트 생성 - 이제 단순히 createVisualization에 데이터 전달
    const chartConfig = createVisualization(
      dataset,
      vizType,
      finalData,
      scalingConfig,
      {}, // colorScalingConfig
      {}  // vizOptions
    );
    
    // 11. Chart.js 인스턴스 생성
    currentChart = new Chart(canvas, chartConfig);
        
  } catch (error) {
    showError('Chart creation failed: ' + error.message);
  }
}

// Main application logic
var currentChart = null;
var generatedData = null;

// 수정된 부분: loadGeneratedData()의 반환값을 받아서 generatedData에 할당
document.addEventListener('DOMContentLoaded', async () => {
  generatedData = loadGeneratedData(); // 데이터를 받아서 할당
  setupEventListeners();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (currentChart) {
    currentChart.destroy();
  }
});