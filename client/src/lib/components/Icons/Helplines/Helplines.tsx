import React from 'react';
import {ClipPath, Defs, G, Path} from 'react-native-svg';
import {IconType} from '..';
import {COLORS} from '../../../../../../shared/src/constants/colors';
import Icon from '../Icon';

export const HelplinesIcon: IconType = ({fill = COLORS.BLACK, style}) => (
  <Icon style={style}>
    <G clipPath="url(#a)">
      <Path
        d="M20.886 14.008a.55.55 0 0 0 .555-.556V5.486a.553.553 0 0 0-.555-.565.553.553 0 0 0-.556.565v7.966c0 .32.235.556.556.556Zm-1.328 10.01c1.648 0 2.759-.47 3.767-1.573.075-.075.14-.15.207-.235.555-.621.828-1.271.828-1.864 0-.707-.376-1.347-1.224-1.93l-2.797-1.95c-.885-.612-1.902-.66-2.693.132l-.706.697c-.245.244-.462.263-.744.075-.509-.349-1.47-1.196-2.138-1.855-.678-.669-1.356-1.441-1.723-2.016-.188-.273-.179-.499.066-.743l.706-.697c.791-.791.735-1.818.123-2.693l-1.987-2.844c-.565-.81-1.225-1.196-1.93-1.206-.603-.01-1.244.264-1.865.81l-.226.198C6.11 7.35 5.63 8.443 5.63 10.156c0 2.77 1.61 6.046 4.737 9.154 3.117 3.098 6.356 4.708 9.19 4.708Zm3.569-11.084a.55.55 0 0 0 .555-.555V6.54a.549.549 0 0 0-.555-.546.549.549 0 0 0-.556.546v5.839c0 .31.245.556.556.556Zm-4.483-.499c.311 0 .556-.244.556-.565V7.04a.557.557 0 0 0-1.111 0v4.83c0 .32.245.565.555.565Zm.914 10.02c-2.401.038-5.405-1.686-8.005-4.266-2.608-2.58-4.388-5.688-4.34-8.089.009-1.017.367-1.893 1.082-2.524.076-.056.132-.103.198-.16.273-.226.556-.348.82-.348.272 0 .517.113.696.395l1.78 2.656c.216.32.226.678-.094.998l-.763.753c-.706.688-.65 1.507-.188 2.148.508.715 1.46 1.789 2.25 2.57.838.829 2.006 1.874 2.693 2.373.64.462 1.45.518 2.147-.188l.754-.763c.31-.33.678-.31.998-.094l2.609 1.733c.291.188.395.424.395.706 0 .254-.122.546-.348.81-.057.066-.104.132-.16.198-.622.715-1.507 1.073-2.524 1.092Zm5.82-11.206c.31 0 .546-.236.546-.556V8.217a.543.543 0 0 0-.547-.556.55.55 0 0 0-.555.556v2.476c0 .32.235.556.555.556Zm-8.994-.49a.55.55 0 0 0 .565-.546V8.716a.553.553 0 0 0-.565-.556.549.549 0 0 0-.546.556v1.497c0 .301.245.546.546.546Z"
        fill={fill}
      />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill="#fff" d="M0 0h30v30H0z" />
      </ClipPath>
    </Defs>
  </Icon>
);
