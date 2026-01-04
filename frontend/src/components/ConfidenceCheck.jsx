import API from "../api/api";


export default function ConfidenceCheck({ setLevel }) {
const submitConfidence = async (correctAnswers) => {
const res = await API.post("/check-level", {
correct_answers: correctAnswers,
});
setLevel(res.data.level);
};


return (
<div>
<p>How many questions did you answer correctly?</p>
<button onClick={() => submitConfidence(2)}>2</button>
<button onClick={() => submitConfidence(4)}>4</button>
<button onClick={() => submitConfidence(5)}>5</button>
</div>
);
}