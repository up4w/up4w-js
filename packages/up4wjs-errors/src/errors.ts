export class UP4WjsError extends Error {
  data: any = null;
  reason: string = "";
  message: string = "";
  constructor(msg: string) {
    super(msg);
    this.message = msg;
  }
}

export class UP4WjsConnectError extends UP4WjsError {
  code: number | null = null;
  constructor(msg: string) {
    super(msg);
  }
}

export class UP4WjsTransactionError extends UP4WjsError {
  signature = "";
  receipt = "";
  constructor(msg: string) {
    super(msg);
  }
}

export const errors = {
  ErrorResponse: function (result: any) {
    const message =
      !!result && !!result.error && !!result.error.message
        ? result.error.message
        : JSON.stringify(result);
    const data =
      !!result.error && !!result.error.data ? result.error.data : null;
    let err: UP4WjsError = new UP4WjsError("Returned error: " + message);
    err.data = data;
    return err;
  },

  InvalidConnection: function (host: string, event?: string) {
    return this.ConnectionError(
      "CONNECTION ERROR: Couldn't connect to node " + host + ".",
      event
    );
  },
  InvalidProvider: function () {
    return new UP4WjsError("Provider not set or invalid");
  },
  InvalidResponse: function (result: any) {
    const message =
      !!result && !!result.error && !!result.error.message
        ? result.error.message
        : "Invalid JSON RPC response: " + JSON.stringify(result);
    return new UP4WjsError(message);
  },
  ConnectionTimeout: function (ms: number) {
    return new UP4WjsError(
      "CONNECTION TIMEOUT: timeout of " + ms + " ms achived"
    );
  },
  ConnectionNotOpenError: function (event?: any) {
    return this.ConnectionError("connection not open on send()", event);
  },
  ConnectionCloseError: function (event: any) {
    if (typeof event === "object" && event.code && event.reason) {
      return this.ConnectionError(
        "CONNECTION ERROR: The connection got closed with " +
          "the close code `" +
          event.code +
          "` and the following " +
          "reason string `" +
          event.reason +
          "`",
        event
      );
    }

    return new UP4WjsError(
      "CONNECTION ERROR: The connection closed unexpectedly"
    );
  },
  MaxAttemptsReachedOnReconnectingError: function () {
    return new UP4WjsError("Maximum number of reconnect attempts reached!");
  },
  PendingRequestsOnReconnectingError: function () {
    return new UP4WjsError(
      "CONNECTION ERROR: Provider started to reconnect before the response got received!"
    );
  },
  ConnectionError: function (msg: string, event?: any): UP4WjsConnectError {
    const error = new UP4WjsConnectError(msg);
    if (event) {
      error.code = event.code;
      error.reason = event.reason;
    }

    return error;
  },

  TransactionRevertInstructionError: function (
    reason: string,
    signature: string,
    receipt: string
  ) {
    var error = new UP4WjsTransactionError(
      "Transaction has been reverted by the EVM:\n" +
        JSON.stringify(receipt, null, 2)
    );
    error.reason = reason;
    error.signature = signature;
    error.receipt = receipt;

    return error;
  },
  TransactionError: function (message: string, receipt: string) {
    var error = new UP4WjsTransactionError(message);
    error.receipt = receipt;
    return error;
  },
  NoContractAddressFoundError: function (receipt: string) {
    return this.TransactionError(
      "The transaction receipt didn't contain a contract address.",
      receipt
    );
  },
  ContractCodeNotStoredError: function (receipt: string) {
    return this.TransactionError(
      "The contract code couldn't be stored, please check your gas limit.",
      receipt
    );
  },
  TransactionRevertedWithoutReasonError: function (receipt: string) {
    return this.TransactionError(
      "Transaction has been reverted by the EVM:\n" +
        JSON.stringify(receipt, null, 2),
      receipt
    );
  },
  TransactionOutOfGasError: function (receipt: string) {
    return this.TransactionError(
      "Transaction ran out of gas. Please provide more gas:\n" +
        JSON.stringify(receipt, null, 2),
      receipt
    );
  },
  ResolverMethodMissingError: function (address: string, name: string) {
    return new UP4WjsError(
      "The resolver at " +
        address +
        'does not implement requested method: "' +
        name +
        '".'
    );
  },
  ContractMissingABIError: function () {
    return new UP4WjsError(
      "You must provide the json interface of the contract when instantiating a contract object."
    );
  },
  ContractOnceRequiresCallbackError: function () {
    return new UP4WjsError("Once requires a callback as the second parameter.");
  },
  ContractEventDoesNotExistError: function (eventName: string) {
    return new UP4WjsError(
      'Event "' + eventName + "\" doesn't exist in this contract."
    );
  },
  ContractReservedEventError: function (type: string) {
    return new UP4WjsError(
      'The event "' + type + "\" is a reserved event name, you can't use it."
    );
  },
  ContractMissingDeployDataError: function () {
    return new UP4WjsError(
      'No "data" specified in neither the given options, nor the default options.'
    );
  },
  ContractNoAddressDefinedError: function () {
    return new UP4WjsError(
      "This contract object doesn't have address set yet, please set an address first."
    );
  },
  ContractNoFromAddressDefinedError: function () {
    return new UP4WjsError(
      'No "from" address specified in neither the given options, nor the default options.'
    );
  },
};
