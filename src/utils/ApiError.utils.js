class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    // Call the parent Error class constructor with the message
    super(message);

    // Setting properties specific to ApiError
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.data = null;

    // Assign the stack trace only if it's provided, otherwise use the default stack trace
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };













// class ApiError extends Error {
//   constructor(
//     StatusCode,
//     message = "something went wrong",
//     errors = [],
//     Stack = ""
//   ) {
//     super(message);
//     this.StatusCode = StatusCode;
//     this.data = null;
//     this.message = message;
//     (this.success = false), (this.error = errors);
//     if(Stack){
//         this.stack = Stack
//     }else{
//         Error.captureStackTrace(this,this.constructor)
//     }
//   }
// }

// export { ApiError };
