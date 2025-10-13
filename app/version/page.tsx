import { BUILD_TAG, BUILD_TIME } from "../_internal/build";
export default function Version(){
  return (
    <main className="glass p-6">
      <div className="font-bold">Build:</div>
      <div>TAG: {BUILD_TAG}</div>
      <div>TIME: {BUILD_TIME}</div>
    </main>
  );
}
