SELECT DATE_SUB(NOW(), INTERVAL 1 WEEK) INTO @startDate;
SELECT DATE_ADD(NOW(), INTERVAL 1 DAY) INTO @endDate;

SELECT COALESCE(v.artistDisplayName, v.artistName) AS "artist",
       COALESCE(v.trackDisplayName, v.trackName)   AS "track",
       (
           SUM(tp.upvotes - tp.downvotes) +
           SUM(tp.snags * 6) +
           SUM(tp.jumps * 2) +
           SUM(IF(c.command = 'props', e.count, 0)) * 5 +
           SUM(IF(c.command = 'noice', e.count, 0)) * 5 +
           SUM(IF(c.command = 'spin', e.count, 0)) * 5 +
           SUM(IF(c.command = 'chips', e.count, 0)) * 5 +
           SUM(IF(c.command = 'tune', e.count, 0)) * 5
       ) *
           COUNT(DISTINCT (u.id)) AS "points",
           count(tp.id) AS "plays"
FROM users u
         JOIN tracksPlayed tp ON tp.djID = u.id
         JOIN videoData v ON tp.videoData_id = v.id
         LEFT JOIN extendedTrackStats e ON e.tracksPlayed_id = tp.id
         LEFT JOIN commandsToCount c ON c.id = e.commandsToCount_id
WHERE tp.whenPlayed BETWEEN @startDate AND @endDate AND
      tp.playedLength > 60 AND
      u.username != 'Mr. Roboto' AND
      DAYOFWEEK(tp.whenPlayed, 'UTC', 'US/Central')) IN ( 0, 1, 2, 3, 4, 5, 6 )
GROUP BY COALESCE(v.artistDisplayName, v.artistName),
         COALESCE(v.trackDisplayName, v.trackName)
ORDER BY 3 DESC, 4 DESC
LIMIT 15;

# with timezone correction
SELECT COALESCE(v.artistDisplayName, v.artistName) AS "artist",
       COALESCE(v.trackDisplayName, v.trackName)   AS "track",
       (
           SUM(tp.upvotes - tp.downvotes) +
           SUM(tp.snags * 6) +
           SUM(tp.jumps * 2) +
           SUM(IF(c.command = 'props', e.count, 0)) * 5 +
           SUM(IF(c.command = 'noice', e.count, 0)) * 5 +
           SUM(IF(c.command = 'spin', e.count, 0)) * 5 +
           SUM(IF(c.command = 'chips', e.count, 0)) * 5 +
           SUM(IF(c.command = 'tune', e.count, 0)) * 5
           ) *
       COUNT(DISTINCT (u.id)) AS "points",
       count(tp.id) AS "plays"
FROM users u
         JOIN tracksPlayed tp ON tp.djID = u.id
         JOIN videoData v ON tp.videoData_id = v.id
         LEFT JOIN extendedTrackStats e ON e.tracksPlayed_id = tp.id
         LEFT JOIN commandsToCount c ON c.id = e.commandsToCount_id
WHERE tp.whenPlayed, 'UTC', 'US/Central') BETWEEN @startDate AND @endDate AND
      tp.playedLength > 60 AND
      u.username != 'Mr. Roboto' AND
      DAYOFWEEK(CONVERT_TZ(tp.whenPlayed, 'UTC', 'US/Central')) IN ( 0, 1, 2, 3, 4, 5, 6 )
GROUP BY COALESCE(v.artistDisplayName, v.artistName),
    COALESCE(v.trackDisplayName, v.trackName)
ORDER BY 3 DESC, 4 DESC
    LIMIT 15;

