import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { geoVoronoi } from 'd3-geo-voronoi';

// Helper to generate relatively even points on a sphere
function getFibonacciSpherePoints(n) {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2; // y goes from 1 to -1
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    
    // convert x,y,z to lon,lat in degrees
    const lat = Math.asin(y) * (180 / Math.PI);
    const lon = Math.atan2(z, x) * (180 / Math.PI);
    points.push([lon, lat]);
  }
  return points;
}

const CryptoGlobe = ({ coins, onSelectCoin, globeStyle = 'default', focusCoin }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [rotation, setRotation] = useState([0, -20, 0]);
  const projectionRef = useRef(null);
  const renderSceneRef = useRef(null);
  
  // Keep track of the latest coins without triggering full re-renders
  const latestCoins = useRef(coins);
  useEffect(() => {
    latestCoins.current = coins;
  }, [coins]);

  // Handle resizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        setIsMobile(window.innerWidth <= 768);
      }
    };
    handleResize(); // Run once immediately
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [coins && coins.length > 0]);

  // Compute Polygons and mapping ONLY when the actual list of coins changes, not their prices
  const coinIds = useMemo(() => coins ? coins.map(c => c.id).join(',') : '', [coins]);
  
  const mappedData = useMemo(() => {
    if (!coins || coins.length === 0) return null;

    // Default, Hexagon, Pentagon, Origami, Jigsaw logic
    const n = globeStyle === 'origami' ? Math.ceil(coins.length / 2) + 2 : coins.length;
    const points = getFibonacciSpherePoints(n);
    
    const voronoi = geoVoronoi()(points);
    let features;
    
    if (globeStyle === 'origami') {
       features = voronoi.triangles().features;
    } else {
       features = voronoi.polygons().features;
    }
    
    const areaHelper = d3.geoPath().area;
    features.forEach(p => {
      p.properties.area = areaHelper(p);
      p.properties.centroid = d3.geoCentroid(p);
    });
    
    features.sort((a, b) => b.properties.area - a.properties.area);
    const sortedCoins = [...coins].sort((a, b) => b.marketCap - a.marketCap);
    
    return features.slice(0, coins.length).map((feature, i) => {
      const coin = sortedCoins[i] || sortedCoins[0];
      
      return {
        feature: feature,
        coin: coin,
        centroid: feature.properties.centroid
      };
    });
  }, [coinIds, globeStyle]);

  // Setup D3 Drag and Render
  useEffect(() => {
    if (!mappedData || dimensions.width === 0) return;
    
    const svg = d3.select(svgRef.current);
    const width = dimensions.width;
    const height = dimensions.height;
    const radius = Math.min(width, height) / 2 * 0.9;
    
    // Setup Orthographic Projection
    const projection = d3.geoOrthographic()
      .translate([width / 2, height / 2])
      .scale(radius)
      .rotate(rotation)
      .clipAngle(90); // Clip anything behind the sphere
      
    projectionRef.current = projection;
      
    const pathGenerator = d3.geoPath().projection(projection);

    let inertiaTimer = null;
    let velocity = [0, 0];

    // Setup Drag interaction with Momentum (Smooth Roller)
    const drag = d3.drag()
      .on('start', () => {
        if (inertiaTimer) inertiaTimer.stop();
        velocity = [0, 0];
      })
      .on('drag', (event) => {
        const rotate = projection.rotate();
        const sensitivity = isMobile ? 0.4 : 0.25; // Increased sensitivity for touch
        
        const dx = event.dx * sensitivity;
        const dy = -event.dy * sensitivity;
        
        velocity = [dx, dy]; // Store instantaneous velocity
        
        const newRot = [rotate[0] + dx, rotate[1] + dy, rotate[2]];
        
        // Limit pitch to prevent flipping
        newRot[1] = Math.max(-80, Math.min(80, newRot[1]));
        
        projection.rotate(newRot);
        setRotation(newRot);
        renderScene();
      })
      .on('end', () => {
        const friction = isMobile ? 0.97 : 0.94; // Higher friction on mobile for longer glide
        
        inertiaTimer = d3.timer(() => {
          velocity[0] *= friction;
          velocity[1] *= friction;
          
          // Stop timer when velocity is negligible
          if (Math.abs(velocity[0]) < 0.02 && Math.abs(velocity[1]) < 0.02) {
             inertiaTimer.stop();
             return;
          }
          
          const rotate = projection.rotate();
          const newRot = [rotate[0] + velocity[0], rotate[1] + velocity[1], rotate[2]];
          newRot[1] = Math.max(-80, Math.min(80, newRot[1]));
          
          projection.rotate(newRot);
          setRotation(newRot);
          renderScene();
        });
      });
      
    svg.call(drag);
    
    // Render function called on mount and on drag
    const renderScene = () => {
      renderSceneRef.current = renderScene;
      // Create ocean base layer
      if (svg.select('.ocean').empty()) {
        // Insert before polygons to ensure it stays in the background
        if (svg.select('.polygons').empty()) {
           svg.append('g').attr('class', 'ocean').append('path').datum({ type: 'Sphere' });
        } else {
           svg.insert('g', '.polygons').attr('class', 'ocean').append('path').datum({ type: 'Sphere' });
        }
      }
      
      svg.select('.ocean path')
        .attr('d', pathGenerator)
        .attr('fill', 'var(--bg-paper)')
        .attr('stroke', 'var(--globe-stroke)')
        .attr('stroke-width', 4)
        .attr('filter', 'url(#handDrawnShadow)');

      // Create container groups if they don't exist
      if (svg.select('.polygons').empty()) svg.append('g').attr('class', 'polygons');
        
      // Draw Polygons
      const paths = svg.select('.polygons').selectAll('path')
        .data(mappedData, d => d.coin.id);

      paths.enter()
        .append('path')
        .attr('class', 'globe-polygon')
        .attr('fill', d => {
           const liveCoin = latestCoins.current.find(c => c.id === d.coin.id) || d.coin;
           return liveCoin.change24h >= 0 ? 'var(--color-bullish)' : 'var(--accent-red)';
        })
        .attr('stroke', 'var(--globe-stroke)')
        .attr('stroke-width', globeStyle === 'origami' ? 2 : 3)
        .attr('stroke-linejoin', 'round')
        .attr('filter', 'url(#handDrawnShadow)')
        .on('click', (event, d) => {
           const liveCoin = latestCoins.current.find(c => c.id === d.coin.id) || d.coin;
           onSelectCoin(liveCoin);
        })
        .on('mouseover', function() {
          d3.select(this).raise().attr('filter', 'url(#handDrawnShadowHover)');
        })
        .on('mouseout', function() {
          d3.select(this).attr('filter', 'url(#handDrawnShadow)');
        })
        .merge(paths)
        .attr('d', d => pathGenerator(d.feature));
        
      paths.exit().remove();
      
      // Draw Text Labels
      const labels = svg.select('.labels').selectAll('g')
        .data(mappedData, d => d.coin.id);
        
      const labelsEnter = labels.enter()
        .append('g')
        .attr('pointer-events', 'none');
        
      labelsEnter.append('text')
        .attr('class', 'label-symbol')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .style('font-family', 'var(--font-heading)')
        .style('font-weight', '700')
        .style('fill', '#ffffff');
        
      labelsEnter.append('text')
        .attr('class', 'label-change')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.2em')
        .style('font-family', 'var(--font-body)')
        .style('fill', '#ffffff');
        
      const labelsUpdate = labelsEnter.merge(labels);
      
      labelsUpdate.each(function(d) {
        // Project the centroid
        const projCoords = projection(d.centroid);
        
        let isVisible = false;
        let projArea = 0;
        
        if (projCoords) {
           const centerLonLat = projection.invert([width/2, height/2]);
           if (centerLonLat) {
             const dist = d3.geoDistance(centerLonLat, d.centroid);
             isVisible = dist < Math.PI / 2.1; // Hide slightly before the exact edge to avoid edge clipping
           }
        }
        
        const g = d3.select(this);
        if (isVisible && projCoords) {
          projArea = pathGenerator.area(d.feature);
          
          g.attr('transform', `translate(${projCoords[0]}, ${projCoords[1]})`)
           .style('display', 'block');
           
          // Only render text if the projected area on screen is large enough
          if (projArea > 1500) {
             const baseSize = Math.sqrt(projArea) / 3.5; // Dynamic sizing based on pixel area
             
             g.select('.label-symbol')
              .text(d.coin.symbol)
              .style('font-size', Math.max(12, Math.min(26, baseSize)) + 'px');
              
             g.select('.label-change')
              .text(() => {
                 const liveCoin = latestCoins.current.find(c => c.id === d.coin.id) || d.coin;
                 return `${liveCoin.change24h > 0 ? '+' : ''}${liveCoin.change24h.toFixed(1)}%`;
              })
              .style('font-size', Math.max(8, Math.min(16, baseSize * 0.6)) + 'px');
          } else {
             g.select('.label-symbol').text('');
             g.select('.label-change').text('');
          }
        } else {
          g.style('display', 'none');
        }
      });
      
      labels.exit().remove();
    };
    
    // Initial render
    renderScene();
    
    // We add an auto-rotate effect when user isn't interacting
    let raf;
    let lastTime = performance.now();
    
    // Simple auto-rotation just for visual flair (optional)
    // Uncommenting this makes the globe spin on its own slowly
    /*
    const autoRotate = (time) => {
      const dt = time - lastTime;
      lastTime = time;
      const rot = projection.rotate();
      projection.rotate([rot[0] + 0.05, rot[1]]);
      renderScene();
      raf = requestAnimationFrame(autoRotate);
    };
    raf = requestAnimationFrame(autoRotate);
    */
    
    return () => {
      if (inertiaTimer) inertiaTimer.stop();
    };
    
  }, [mappedData, dimensions]);

  // Handle focusCoin to rotate globe smoothly
  useEffect(() => {
    if (!focusCoin || !mappedData || !projectionRef.current || !renderSceneRef.current) return;
    
    const targetData = mappedData.find(d => d.coin.id === focusCoin.id);
    if (targetData) {
      const [lon, lat] = targetData.centroid;
      const targetRotation = [-lon, -lat, 0];
      
      const currentRotation = projectionRef.current.rotate();
      
      // Interpolate rotation smoothly
      const svg = d3.select(svgRef.current);
      
      // Normalize current rotation longitude to take shortest path
      let currentLon = currentRotation[0] % 360;
      let targetLon = targetRotation[0] % 360;
      
      if (currentLon - targetLon > 180) {
         targetLon += 360;
      } else if (targetLon - currentLon > 180) {
         currentLon += 360;
      }
      
      d3.transition()
        .duration(1000)
        .ease(d3.easeCubicInOut)
        .tween('rotate', () => {
          const iLon = d3.interpolate(currentLon, targetLon);
          const iLat = d3.interpolate(currentRotation[1], targetRotation[1]);
          return (t) => {
            const newRot = [iLon(t), iLat(t), 0];
            projectionRef.current.rotate(newRot);
            setRotation(newRot);
            renderSceneRef.current();
          };
        });
    }
  }, [focusCoin, mappedData]);

  // Fast live update for prices without rebuilding geometry
  useEffect(() => {
    if (!svgRef.current || !coins) return;
    const svg = d3.select(svgRef.current);
    
    svg.select('.polygons').selectAll('path')
      .attr('fill', d => {
         const liveCoin = coins.find(c => c.id === d.coin.id) || d.coin;
         return liveCoin.change24h >= 0 ? 'var(--color-bullish)' : 'var(--accent-red)';
      });
      
    svg.select('.labels').selectAll('g').each(function(d) {
       const liveCoin = coins.find(c => c.id === d.coin.id) || d.coin;
       d3.select(this).select('.label-change')
         .text(`${liveCoin.change24h > 0 ? '+' : ''}${liveCoin.change24h.toFixed(1)}%`);
    });
  }, [coins]);

  if (!coins || coins.length === 0) {
    return <div style={{ color: 'var(--fg-pencil)', padding: '24px', fontFamily: 'var(--font-heading)', fontSize: '24px' }}>Drafting Earth...</div>;
  }

  return (
    <div ref={containerRef} style={styles.container}>
      <svg ref={svgRef} width="100%" height="100%" style={styles.svg}>
        <defs>
          {/* SVG Filter for Hand-Drawn Hard Shadow */}
          <filter id="handDrawnShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="var(--shadow-color)" floodOpacity="1"/>
          </filter>
          
          <filter id="handDrawnShadowHover" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="6" dy="6" stdDeviation="0" floodColor="var(--shadow-color)" floodOpacity="1"/>
          </filter>
        </defs>
        
        {/* The ocean / base of the globe */}
        <circle 
          cx={dimensions.width / 2} 
          cy={dimensions.height / 2} 
          r={Math.min(dimensions.width, dimensions.height) / 2 * 0.9} 
          fill="var(--bg-paper)" 
          stroke="var(--globe-stroke)"
          strokeWidth="4"
          strokeDasharray="8 4 4 4"
        />

        <g className="polygons" cursor="grab" />
        <g className="labels" />
      </svg>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  svg: {
    display: 'block',
    // Apply a subtle rotation to the entire SVG to break perfect alignment
    transform: 'rotate(1deg)',
  }
};

export default CryptoGlobe;
