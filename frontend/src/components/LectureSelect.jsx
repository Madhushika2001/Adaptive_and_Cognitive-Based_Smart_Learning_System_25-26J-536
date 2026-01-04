export default function LectureSelect({ setLecture }) {
return (
<select onChange={(e) => setLecture(e.target.value)}>
<option value="">Select Lecture</option>
<option>Lecture1</option>
<option>Lecture2</option>
</select>
);
}