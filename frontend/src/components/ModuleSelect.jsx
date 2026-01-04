export default function ModuleSelect({ setModule }) {
return (
<select onChange={(e) => setModule(e.target.value)}>
<option value="">Select Module</option>
<option>CloudComputing</option>
<option>DeepLearning</option>
<option>DatabaseAdministration</option>
</select>
);
}