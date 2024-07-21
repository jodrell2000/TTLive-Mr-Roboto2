SELECT "2024-07-11 12:00:00" INTO @startDate;
SELECT "2024-07-18 12:00:00" INTO @endDate;

SELECT u.username,
       (
           1 +
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
      DAYOFWEEK(tp.whenPlayed) IN ( 0, 1, 2, 3, 4, 5, 6 )
GROUP BY u.username
ORDER BY 2 DESC, 3 DESC
LIMIT 10;








SELECT username, SUM(points) as "Real Points" FROM (
           SELECT u.username, (
                                  1 +
                                  SUM(tp.upvotes - tp.downvotes) +
                                  SUM(tp.snags * 6) +
                                  SUM(tp.jumps * 2) +
                                  SUM(IF(c.command = 'props', e.count, 0)) * 5 +
                                  SUM(IF(c.command = 'noice', e.count, 0)) * 5 +
                                  SUM(IF(c.command = 'spin', e.count, 0)) * 5 +
                                  SUM(IF(c.command = 'chips', e.count, 0)) * 5 +
                                  SUM(IF(c.command = 'tune', e.count, 0)) * 5
                                  ) *
                              COUNT(DISTINCT (u.id)) AS "points"
           FROM users u
                    JOIN tracksPlayed tp ON tp.djID=u.id
                    JOIN videoData v ON tp.videoData_id = v.id
                    LEFT JOIN extendedTrackStats e ON e.tracksPlayed_id = tp.id
                    LEFT JOIN commandsToCount c ON c.id=e.commandsToCount_id
           WHERE tp.whenPlayed BETWEEN @theStartDate AND @theEndDate AND
                 tp.length>60
           GROUP BY tp.id, u.username
       ) trackPoints
GROUP BY username
ORDER BY 2 DESC
LIMIT 11;
