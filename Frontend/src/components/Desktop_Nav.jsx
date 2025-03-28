import { Link } from 'react-router-dom';
import styles from '../styles/Desktop-nav.module.css';


const Desktop_Nav = () => {
  return (
    <div className={styles.desktop_nav}>
        <div className='logo'>
            <Link to="/">
                <h1>Image Tool</h1>
            </Link>
        </div>
        <div className={styles.nav}>
            <Link to='/convert' className={styles.nav_item}>CONVERT IMAGES</Link>
            <Link to='/compress' className={styles.nav_item}>COMPRESS IMAGES</Link>
            <Link to='/crop' className={styles.nav_item}>CROP IMAGES</Link>
            <Link to='/rotate' className={styles.nav_item}>ROTATE IMAGES</Link>
        </div>

    </div>
  );
}

export default Desktop_Nav;
