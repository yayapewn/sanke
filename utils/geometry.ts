import { Point } from '../types';

/**
 * Calculates the distance between two points.
 */
export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Gets the angle in radians between two points.
 */
export const angle = (p1: Point, p2: Point): number => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

/**
 * Simple Chaikin's algorithm for curve smoothing.
 * Iteratively cuts corners to create a smoother path from raw input.
 * Optimized: Default iterations reduced from 4 to 3 for better performance.
 */
export const smoothStroke = (points: Point[], iterations: number = 3): Point[] => {
  if (points.length < 3) return points;

  let smoothed = points;

  for (let k = 0; k < iterations; k++) {
    const next: Point[] = [];
    next.push(smoothed[0]); // Keep start
    
    for (let i = 0; i < smoothed.length - 1; i++) {
      const p0 = smoothed[i];
      const p1 = smoothed[i + 1];

      // Q = 0.75 * P0 + 0.25 * P1
      // R = 0.25 * P0 + 0.75 * P1
      next.push({
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y
      });
      next.push({
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y
      });
    }
    
    next.push(smoothed[smoothed.length - 1]); // Keep end
    smoothed = next;
  }
  
  return smoothed;
};

/**
 * Interpolates points along a path at a fixed interval.
 * Returns cumulative distance for texture mapping.
 */
export const getPointsOnPath = (path: Point[], spacing: number): { point: Point, angle: number, dist: number }[] => {
  if (path.length < 2) return [];

  const result: { point: Point, angle: number, dist: number }[] = [];
  let accumulatedDist = 0;
  
  // Start point
  result.push({ point: path[0], angle: angle(path[0], path[1]), dist: 0 });

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i+1];
    const dist = distance(p1, p2);
    
    if (dist === 0) continue;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    // Calculate angle for this segment
    const segmentAngle = Math.atan2(dy, dx);

    let currentDistInSegment = spacing - (accumulatedDist % spacing);
    if (currentDistInSegment === 0) currentDistInSegment = spacing;

    while (currentDistInSegment <= dist) {
      const t = currentDistInSegment / dist;
      const newPoint = {
        x: p1.x + dx * t,
        y: p1.y + dy * t
      };
      
      // We track distance to map the texture u-coordinate correctly
      const prevDist = result[result.length-1].dist;
      result.push({ point: newPoint, angle: segmentAngle, dist: prevDist + spacing });
      
      currentDistInSegment += spacing;
    }
    
    accumulatedDist += dist;
  }

  return result;
};

export interface RibbonSlice {
  center: Point;
  left: Point;
  right: Point;
  angle: number;
  dist: number;
}

/**
 * Generates a ribbon mesh (left and right edges) from a path.
 * Uses Miter Joint logic to maintain constant perpendicular width.
 */
export const getRibbonMesh = (path: Point[], spacing: number, thickness: number): RibbonSlice[] => {
  const centerPoints = getPointsOnPath(path, spacing);
  const halfWidth = thickness / 2;
  
  if (centerPoints.length < 2) return [];

  return centerPoints.map((p, i) => {
    let angleVal = p.angle;
    let miterLength = halfWidth;

    if (i > 0 && i < centerPoints.length - 1) {
        const pPrev = centerPoints[i-1].point;
        const pNext = centerPoints[i+1].point;
        
        // Incoming vector (normalized)
        const dx1 = p.point.x - pPrev.x;
        const dy1 = p.point.y - pPrev.y;
        const len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
        const ux1 = dx1 / (len1 || 1);
        const uy1 = dy1 / (len1 || 1);
        
        // Outgoing vector (normalized)
        const dx2 = pNext.x - p.point.x;
        const dy2 = pNext.y - p.point.y;
        const len2 = Math.sqrt(dx2*dx2 + dy2*dy2);
        const ux2 = dx2 / (len2 || 1);
        const uy2 = dy2 / (len2 || 1);
        
        // Tangent vector (sum of directions)
        const tx = ux1 + ux2;
        const ty = uy1 + uy2;
        
        // Direction of the miter line (normal to the tangent)
        angleVal = Math.atan2(ty, tx);

        // Miter adjustment:
        // Calculate the expansion factor needed to keep the ribbon width constant.
        // scale = 1 / dot(miter_normal, segment_normal)
        
        const mx = -Math.sin(angleVal); // Miter X
        const my = Math.cos(angleVal);  // Miter Y
        
        const nx1 = -uy1; // Segment Normal X
        const ny1 = ux1;  // Segment Normal Y
        
        const dot = mx * nx1 + my * ny1;
        
        if (Math.abs(dot) > 0.1) {
             miterLength = halfWidth / dot;
        }
        
        // Clamp miter length to prevent massive spikes at sharp turns
        miterLength = Math.min(miterLength, halfWidth * 5);
    }
    
    const nx = -Math.sin(angleVal);
    const ny = Math.cos(angleVal);

    return {
      center: p.point,
      left: {
        x: p.point.x + nx * miterLength,
        y: p.point.y + ny * miterLength
      },
      right: {
        x: p.point.x - nx * miterLength,
        y: p.point.y - ny * miterLength
      },
      angle: angleVal,
      dist: p.dist
    };
  });
};