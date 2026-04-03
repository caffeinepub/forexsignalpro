import Text "mo:core/Text";
import Map "mo:core/Map";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Float "mo:core/Float";
import OutCall "http-outcalls/outcall";
import Iter "mo:core/Iter";

actor {
  type ForexSignal = {
    id : Nat;
    pair : Text;
    market : Text;
    direction : Text;
    strength : Float;
    entryPrice : Float;
    exitPrice : Float;
    success : ?Bool;
    timestamp : Int;
    validity : Nat;
    reversed : Bool;
  };

  var signalId = 0;
  var nextSignalId = 0;

  let forexSignals = Map.empty<Nat, ForexSignal>();

  func getCurrentTime() : Int {
    Time.now();
  };

  public type ForexStats = {
    total : Nat;
    wins : Nat;
    losses : Nat;
    winRate : Nat;
  };

  func calculateStats(signals : [ForexSignal]) : {
    total : Nat;
    wins : Nat;
    losses : Nat;
    winRate : Nat;
  } {
    var total = 0;
    var wins = 0;
    var losses = 0;

    for (signal in signals.values()) {
      switch (signal.success) {
        case (?true) { wins += 1 };
        case (?false) { losses += 1 };
        case (_) {};
      };
      total += 1;
    };

    let winRate = if (total > 0) {
      (wins * 100) / total;
    } else { 0 };

    {
      total;
      wins;
      losses;
      winRate;
    };
  };

  // Actors
  public query func getAllSignals() : async [ForexSignal] {
    forexSignals.values().toArray().reverse();
  };

  public shared ({ caller }) func saveSignal(
    pair : Text,
    market : Text,
    direction : Text,
    strength : Float,
    entryPrice : Float,
    exitPrice : Float,
    success : ?Bool,
    validity : Nat,
    reversed : Bool,
  ) : async Nat {
    let newSignal : ForexSignal = {
      id = signalId;
      pair;
      market;
      direction;
      strength;
      entryPrice;
      exitPrice;
      success;
      timestamp = getCurrentTime();
      validity;
      reversed;
    };
    forexSignals.add(signalId, newSignal);
    signalId += 1;
    signalId - 1;
  };

  public query ({ caller }) func getOverallStats() : async ForexStats {
    calculateStats(forexSignals.values().toArray());
  };

  public query ({ caller }) func getStatsByPair(pair : Text, market : Text) : async ForexStats {
    let filteredSignals = forexSignals.values().toArray().filter(
      func(signal) {
        signal.pair == pair and signal.market == market
      }
    );
    calculateStats(filteredSignals);
  };

  public query ({ caller }) func getNewestSignalId() : async Nat {
    nextSignalId;
  };

  public shared ({ caller }) func clearHistory() : async () {
    forexSignals.clear();
    signalId := 0;
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func getForexPrice(pair : Text) : async Text {
    let url = "https://api.twelvedata.com/price?symbol=" # pair # "&apikey=44c2051d28f84197a0b07bdb85c38a85";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public func getForexCandles(pair : Text, interval : Text) : async Text {
    let url = "https://api.twelvedata.com/time_series?symbol=" # pair #
      "&interval=" # interval # "&outputsize=60&apikey=44c2051d28f84197a0b07bdb85c38a85";
    await OutCall.httpGetRequest(url, [], transform);
  };
};
