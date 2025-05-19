import ChartRenderer from "./ChartRenderer";

export default function ResultCard({ result, onSave }) {
  const {
    sql,
    data = [],
    columns = [],
    summary = "",
    chart_type = "table",
    original_prompt = ""
  } = result;

  const prompt = original_prompt.toLowerCase();

  const mentionsChart =
    prompt.includes("chart") ||
    prompt.includes("graph") ||
    prompt.includes("bar chart") ||
    prompt.includes("bar graph") ||
    prompt.includes("line chart") ||
    prompt.includes("line graph") ||
    prompt.includes("pie chart") ||
    prompt.includes("pie graph");

  const isSingleValue = data.length === 1 && columns.length === 1;
  const isTwoColOneRow = data.length === 1 && columns.length === 2;
  const isMultiRow = data.length > 1;
  const isTwoCol = columns.length === 2;

  const isChartType = chart_type !== "table";
  const canRenderChart = isChartType && isTwoCol && isMultiRow;
  const shouldRenderTable =
    chart_type === "table" ||
    mentionsChart ||
    (!canRenderChart && isMultiRow && columns.length >= 2);

  const isErrorMessage = summary.toLowerCase().includes("couldn't retrieve data");

  return (
    <div className="result-card">
      <p><strong>SQL:</strong> {sql || "(No valid SQL returned)"}</p>

      {isErrorMessage ? (
        <p style={{ color: "var(--error-color, red)" }}>{summary}</p>
      ) : shouldRenderTable ? (
        <table>
          <thead>
            <tr>
              {columns.map((col, i) => <th key={i}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j}>{row[col]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : canRenderChart ? (
        <ChartRenderer chartType={chart_type} data={data} columns={columns} />
      ) : isSingleValue ? (
        <p><strong>Result:</strong> {data[0][columns[0]]}</p>
      ) : isTwoColOneRow ? (
        <p>
          <strong>{columns[0]}:</strong> {data[0][columns[0]]}<br />
          <strong>{columns[1]}:</strong> {data[0][columns[1]]}
        </p>
      ) : (
        <p>{summary}</p>
      )}

      {!isErrorMessage && (
        <button onClick={() => onSave(result)} className="btn-save">Save</button>
      )}
    </div>
  );
}
