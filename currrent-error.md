PS C:\Users\Hp\MoonPlayer> npm run lint

> moonplayer@0.0.0 lint
> eslint .


C:\Users\Hp\MoonPlayer\src\components\common\AnimatedListItem\AnimatedListItem.jsx
  1:8  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  no-unused-vars

C:\Users\Hp\MoonPlayer\src\components\common\EmptyState\EmptyState.jsx
  1:8  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  no-unused-vars

C:\Users\Hp\MoonPlayer\src\components\common\LayoutSwitch\LayoutSwitch.jsx
  1:8  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  no-unused-vars

C:\Users\Hp\MoonPlayer\src\components\common\LoadingSkeleton\LoadingSkeleton.jsx      
  1:8  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  no-unused-vars

C:\Users\Hp\MoonPlayer\src\components\common\SongRow\SongRow.jsx
  17:31  warning  'isPlaying' is assigned a value but never used. Allowed unused vars must match /^_/u  no-unused-vars

C:\Users\Hp\MoonPlayer\src\components\player\FullscreenPlayer\FullscreenPlayer.jsx    
  1:8  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  no-unused-vars

C:\Users\Hp\MoonPlayer\src\components\player\PlayerOverlayWrapper\PlayerOverlayWrapper.jsx
  1:8  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  no-unused-vars

C:\Users\Hp\MoonPlayer\src\components\player\ProgressBar\GradientProgressBar.jsx      
  1:8  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  no-unused-vars

C:\Users\Hp\MoonPlayer\src\views\pages\AlbumView.jsx
   1:8   warning  'React' is defined but never used. Allowed unused vars must match /^_/u                                               no-unused-vars
   3:25  warning  'Heart' is defined but never used. Allowed unused vars must match /^_/u                                               no-unused-vars
  21:9   warning  'navigate' is assigned a value but never used. Allowed unused vars must match /^_/u                                   no-unused-vars
  77:6   warning  React Hook useEffect has a missing dependency: 'fetchAlbumDetails'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

C:\Users\Hp\MoonPlayer\src\views\pages\ArtistView.jsx
   1:8   warning  'React' is defined but never used. Allowed unused vars must match /^_/u                                                no-unused-vars
   3:30  warning  'MusicNotes' is defined but never used. Allowed unused vars must match /^_/u                                           no-unused-vars
  77:6   warning  React Hook useEffect has a missing dependency: 'fetchArtistDetails'. Either include it or remove the dependency array  react-hooks/exhaustive-deps        

C:\Users\Hp\MoonPlayer\src\views\pages\Library.jsx
    8:10  warning  'Heart' is defined but never used. Allowed unused vars must match /^_/u                  no-unused-vars
    8:33  warning  'ClockCounterClockwise' is defined but never used. Allowed unused vars must match /^_/u  no-unused-vars
  157:53  warning  'idx' is defined but never used. Allowed unused args must match /^_/u                    no-unused-vars

C:\Users\Hp\MoonPlayer\src\views\pages\Search.jsx
  1:8  warning  'React' is defined but never used. Allowed unused vars must match /^_/u  no-unused-vars

C:\Users\Hp\MoonPlayer\src\views\pages\Settings.jsx
  6:10  warning  'usePlayerStore' is defined but never used. Allowed unused vars must match /^_/u  no-unused-vars

✖ 20 problems (0 errors, 20 warnings)

also there are many depreceated icons name you are using run react doctor to check this out Also I would Verify it against C:\Users\Hp\MoonPlayer\Implementation\01-UI-ARCHITECTURE-COMPONENT-HIERARCHY.md Did the AI build all the required Task and build completely Assume that you don't know what happened previously so that you can critically identify if something is missed 