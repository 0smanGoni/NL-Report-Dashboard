import ChartRenderer from "./ChartRenderer";

export default function SavedReports({ reports, onDelete }) {
  return (
    <div>
      <h2>Saved Reports</h2>
      {reports.map((r) => {
        const json = r.json_result;
        const columns = json && json.length ? Object.keys(json[0]) : [];

        const title = r.title?.toLowerCase() || "";
        const mentionsTable = title.includes("table");
        const mentionsChart =
          title.includes("chart") ||
          title.includes("graph") ||
          title.includes("bar chart") ||
          title.includes("bar graph") ||
          title.includes("line chart") ||
          title.includes("line graph") ||
          title.includes("pie chart") ||
          title.includes("pie graph");

        const isSingleValue = json?.length === 1 && columns?.length === 1;
        const isTwoColOneRow = json?.length === 1 && columns?.length === 2;
        const isMultiRow = json?.length > 1;
        const isTwoCol = columns?.length === 2;

        const isChartType = r.chart_type !== "table";
        const shouldRenderChart = isChartType && !mentionsTable && !isSingleValue && isTwoCol && isMultiRow;
        const shouldRenderTable =
          mentionsTable || mentionsChart || r.chart_type === "table" || (!shouldRenderChart && isMultiRow && columns.length >= 2);

        return (
          <div key={r.id} className="saved-report">
            <p><strong>{r.title}</strong></p>

            {shouldRenderTable ? (
              <table>
                <thead>
                  <tr>{columns.map((col, i) => <th key={i}>{col}</th>)}</tr>
                </thead>
                <tbody>
                  {json.map((row, i) => (
                    <tr key={i}>
                      {columns.map((col, j) => (
                        <td key={j}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : shouldRenderChart ? (
              <ChartRenderer chartType={r.chart_type} data={json} columns={columns} />
            ) : isSingleValue ? (
              <p><strong>Result:</strong> {json[0][columns[0]]}</p>
            ) : isTwoColOneRow ? (
              <p>
                <strong>{columns[0]}:</strong> {json[0][columns[0]]}<br />
                <strong>{columns[1]}:</strong> {json[0][columns[1]]}
              </p>
            ) : (
              <p>{r.summary}</p>
            )}

            <button onClick={() => onDelete(r.id)} className="btn-delete">Delete</button>
          </div>
        );
      })}
    </div>
  );
}
