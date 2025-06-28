// data_load.js
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

function hideError() {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
}

// 데이터를 반환하는 방식으로 변경
export function loadGeneratedData() {
  hideError();
  
  try {
    const dataString = sessionStorage.getItem('generatedData');
    if (!dataString) {
      showError('No data found. Please generate data first.');
      const dataInfo = document.getElementById('data-info');
      if (dataInfo) {
        dataInfo.innerHTML = 
          '<strong>❌ No data found.</strong> <a href="index.html">Go back to generate data</a>';
      }
      return null; // null 반환
    }
    
    const generatedData = JSON.parse(dataString);
    console.log('📊 Loaded data:', generatedData);
    
    // Show data info
    const dataInfo = document.getElementById('data-info');
    if (dataInfo) {
      const pointCount = generatedData.data_value ? generatedData.data_value.length : 0;
      const dimensions = generatedData.basic_data ? generatedData.basic_data.dim : 0;
      const axisNames = generatedData.basic_data ? 
        generatedData.basic_data.axes.map(a => a.name).join(', ') : 'Unknown';
      
      dataInfo.innerHTML = `
        <strong>✅ Data loaded successfully!</strong><br>
        Points: ${pointCount} | Dimensions: ${dimensions} | Available axes: ${axisNames}
      `;
    }

    // Enable form
    const createBtn = document.getElementById('create-chart-btn');
    if (createBtn) {
      createBtn.disabled = false;
    }
    
    return generatedData; // 데이터 반환
    
  } catch (error) {
    console.error('❌ Failed to load data:', error);
    showError('Failed to load data: ' + error.message);
    const dataInfo = document.getElementById('data-info');
    if (dataInfo) {
      dataInfo.innerHTML = 
        '<strong>❌ Error loading data.</strong> <a href="index.html">Go back to generate data</a>';
    }
    return null; // 에러시 null 반환
  }
}