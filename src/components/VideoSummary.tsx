import './VideoSummary.css'

interface VideoSummaryProps {
  summary: string
  title?: string
}

function VideoSummary({ summary, title = '视频内容总结' }: VideoSummaryProps) {
  if (!summary || summary.trim().length === 0) {
    return null
  }

  return (
    <section
      className="video-summary"
      role="region"
      aria-labelledby="summary-heading"
    >
      <h4 id="summary-heading" className="summary-title">
        {title}
      </h4>
      <div className="summary-content">
        <p>{summary}</p>
      </div>
    </section>
  )
}

export default VideoSummary
