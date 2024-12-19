class ApiError extends Error {
  constructor(
    StatusCode,
    message = "something went wrong",
    errors = [],
    Stack = ""
  ) {
    super(message);
    this.StatusCode = StatusCode;
    this.data = null;
    this.message = message;
    (this.success = false), (this.error = errors);
    if(Stack){
        this.stack = Stack
    }else{
        Error.captureStackTrace(this,this.constructor)
    }
  }
}

export { ApiError };
