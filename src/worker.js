// Listen for messages from the main thread
self.onmessage = event => {
  // Extract the input arguments from the message data
  const { subarray, negative, array } = event.data;

  // Define a variable to hold the current maximum sequential occurrence
  let maxOccurrence = 0;

  // Define a variable to hold the current sequential occurrence
  let currentOccurrence = 0;

  // Loop over the array
  for (let i = 0; i < array.length; i++) {
    // If the current element matches the first element of the subarray
    if (array[i] === subarray[0]) {
      // Define a variable to track whether the subarray is currently matching
      let isMatching = true;

      // Loop over the subarray
      for (let j = 1; j < subarray.length; j++) {
        // If the current element doesn't match the corresponding element in the subarray
        if (array[i + j] !== subarray[j]) {
          // The subarray is not currently matching
          isMatching = false;

          // Exit the inner loop
          break;
        }
      }

      // If the subarray is currently matching and none of the negative subarrays match
      if (isMatching && !negative.some(negativeSubarray => array.slice(i, i + subarray.length).includes(...negativeSubarray))) {
        // Increment the current sequential occurrence
        currentOccurrence++;

        // Update the maximum sequential occurrence if necessary
        if (currentOccurrence > maxOccurrence) {
          maxOccurrence = currentOccurrence;
        }
      } else {
        // The subarray is not currently matching or a negative subarray matched
        // Reset the current sequential occurrence
        currentOccurrence = 0;
      }
    } else {
      // The current element doesn't match the first element of the subarray
      // Reset the current sequential occurrence
      currentOccurrence = 0;
    }
  }

  // Export the result to the main thread
  self.postMessage(maxOccurrence);
};
