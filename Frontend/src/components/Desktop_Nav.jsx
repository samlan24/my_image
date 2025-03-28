import { Link } from 'react-router-dom';
import styles from '../styles/Desktop-nav.module.css';
import logo from '../assets/music.svg';

const Desktop_Nav = () => {
  return (
    <div className={styles.desktop_nav}>
        <div className='logo'>
            <Link to="/">
                <h1>Image Tool</h1>
            </Link>
        </div>
        <div className={styles.nav}>
            <Link to='/convert' className={styles.nav_item}>Convert Images</Link>
            <Link to='/compress' className={styles.nav_item}>Compress Images</Link>
            <Link to='/crop' className={styles.nav_item}>Crop Images</Link>
            <Link to='/rotate' className={styles.nav_item}>Rotate Images</Link>
        </div>

    </div>
  );
}

export default Desktop_Nav;
